import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config as loadEnv } from 'dotenv';
loadEnv();

import Course from './models/Course.js';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const Bucket = process.env.R2_BUCKET_NAME || 'vyapari-kit-media';
const CDN_BASE = process.env.R2_PUBLIC_URL || 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev';

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

async function optimizeAndUpload(
  filePath: string,
  r2Key: string
): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || 'image/png';
  const originalBuffer = fs.readFileSync(filePath);

  let bufferToUpload: Buffer;
  try {
    // Keep max width 1600px for crisp diagrams & business plans, optimize file size
    if (ext === '.png') {
      bufferToUpload = await sharp(originalBuffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .png({ compressionLevel: 9, effort: 7 })
        .toBuffer();
    } else if (ext === '.jpg' || ext === '.jpeg') {
      bufferToUpload = await sharp(originalBuffer)
        .resize({ width: 1600, withoutEnlargement: true })
        .jpeg({ quality: 85, mozjpeg: true })
        .toBuffer();
    } else {
      bufferToUpload = originalBuffer;
    }
  } catch (err) {
    console.warn(`    Sharp optimization failed for ${filePath}, using original:`, err);
    bufferToUpload = originalBuffer;
  }

  const origMb = (originalBuffer.length / 1024 / 1024).toFixed(2);
  const optMb = (bufferToUpload.length / 1024 / 1024).toFixed(2);

  await s3Client.send(
    new PutObjectCommand({
      Bucket,
      Key: r2Key,
      Body: bufferToUpload,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  console.log(`    -> Uploaded ${r2Key} (${origMb}MB -> ${optMb}MB)`);
  return `${CDN_BASE}/${r2Key}`;
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB.');

  const courses = await Course.find({}, { title: 1, slug: 1, _id: 1, gallery: 1 }).lean();
  console.log(`Found ${courses.length} courses in database.`);

  const dataDir = path.resolve('src/data');
  const items = fs.readdirSync(dataDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  console.log(`Found ${items.length} folders in ${dataDir}.\n`);

  let successCount = 0;
  let skippedCount = 0;
  const results: any[] = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const folderPath = path.join(dataDir, item.name);
    const normItem = normalize(item.name);

    // Match by exact normalized title or slug, then substring
    let course = courses.find((c) => normalize(c.title) === normItem || normalize(c.slug) === normItem);
    if (!course) {
      course = courses.find((c) => {
        const normTitle = normalize(c.title);
        const normSlug = normalize(c.slug);
        return normItem.includes(normTitle) || normTitle.includes(normItem) ||
               normItem.includes(normSlug) || normSlug.includes(normItem);
      });
    }

    if (!course) {
      console.warn(`[SKIP] No matching course found for folder: "${item.name}"`);
      skippedCount++;
      continue;
    }

    console.log(`[${idx + 1}/${items.length}] Processing: "${item.name}" -> Course: "${course.title}" (${course.slug})`);

    // List all image files and sort them naturally (1.png, 2.png, ..., 10.png)
    const rawFiles = fs.readdirSync(folderPath).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
    });

    rawFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10);
      const numB = parseInt(b.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });

    if (rawFiles.length === 0) {
      console.warn(`    No image files found in ${item.name}`);
      skippedCount++;
      continue;
    }

    const galleryItems: any[] = [];

    for (let fIdx = 0; fIdx < rawFiles.length; fIdx++) {
      const fileName = rawFiles[fIdx];
      const filePath = path.join(folderPath, fileName);
      const r2Key = `images/courses/${course.slug}/${fileName}`;

      const uploadedUrl = await optimizeAndUpload(filePath, r2Key);

      galleryItems.push({
        id: `${course.slug}-${fIdx + 1}`,
        url: uploadedUrl,
        label: `${course.title} - Preview ${fIdx + 1}`,
        caption: `${course.title} Preview ${fIdx + 1}`,
        alt: `${course.title} Preview ${fIdx + 1}`,
      });
    }

    // Update MongoDB course record
    const updateRes = await Course.updateOne(
      { _id: course._id },
      { $set: { gallery: galleryItems } }
    );

    console.log(`    -> Updated MongoDB gallery for course: ${course.title} (${galleryItems.length} slides, modified: ${updateRes.modifiedCount})\n`);
    successCount++;
    results.push({
      folder: item.name,
      courseTitle: course.title,
      slug: course.slug,
      slideCount: galleryItems.length,
    });
  }

  console.log('==============================================');
  console.log(`COMPLETED! Successfully updated: ${successCount} courses, Skipped: ${skippedCount}`);
  console.log('==============================================');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error during import:', err);
  process.exit(1);
});
