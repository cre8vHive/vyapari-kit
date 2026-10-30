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

function norm(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/business\s+in\s+a\s+box/gi, '')
    .replace(/profit\s+blueprint/gi, '')
    .replace(/[^a-z0-9]/g, '');
}

async function optimizeAndUpload(filePath: string, r2Key: string): Promise<string> {
  const originalBuffer = fs.readFileSync(filePath);

  let bufferToUpload: Buffer;
  try {
    bufferToUpload = await sharp(originalBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .png({ compressionLevel: 9, effort: 7 })
      .toBuffer();
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
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  console.log(`    -> Uploaded to R2: ${r2Key} (${origMb}MB -> ${optMb}MB)`);
  return `${CDN_BASE}/${r2Key}`;
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB.');

  const planCourses = await Course.find(
    { packageType: 'business-plans' },
    { title: 1, slug: 1, _id: 1, categoryName: 1 }
  ).lean();
  console.log(`Found ${planCourses.length} business-plans in database.`);

  const baseFolder = 'C:/Users/aladi/Downloads/business in the box updated banners-20261029T145954Z-1-001';
  if (!fs.existsSync(baseFolder)) {
    throw new Error(`Directory not found: ${baseFolder}`);
  }

  const courseDirs = fs
    .readdirSync(baseFolder, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log(`Found ${courseDirs.length} course banner directories to process.\n`);

  let successCount = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < courseDirs.length; idx++) {
    const dirName = courseDirs[idx];
    const dirPath = path.join(baseFolder, dirName);
    const dNorm = norm(dirName);

    let course = planCourses.find((c) => norm(c.title) === dNorm || norm(c.slug) === dNorm);
    if (!course) {
      course = planCourses.find((c) => {
        const cNormT = norm(c.title);
        const cNormS = norm(c.slug);
        return (
          dNorm.length > 5 &&
          (cNormT.includes(dNorm) || dNorm.includes(cNormT) || cNormS.includes(dNorm) || dNorm.includes(cNormS))
        );
      });
    }

    if (!course) {
      console.warn(`[SKIP] No course match for directory: "${dirName}"`);
      skippedCount++;
      continue;
    }

    console.log(`[${idx + 1}/${courseDirs.length}] Processing: "${dirName}"`);
    console.log(`    Matched to: "${course.title}" (${course.slug})`);

    const img1Path = path.join(dirPath, '1.png');
    const img2Path = path.join(dirPath, '2.png');

    if (!fs.existsSync(img1Path) || !fs.existsSync(img2Path)) {
      console.warn(`[WARN] Missing 1.png or 2.png in "${dirName}". Skipping.`);
      skippedCount++;
      continue;
    }

    // Upload 1.png as bib-1.png and bib-cover.png (for backwards compatibility)
    const r2Key1 = `images/courses/${course.slug}/bib-1.png`;
    const cdnUrl1 = await optimizeAndUpload(img1Path, r2Key1);

    // Also overwrite bib-cover.png with the new 1.png
    await optimizeAndUpload(img1Path, `images/courses/${course.slug}/bib-cover.png`);

    // Upload 2.png as bib-2.png
    const r2Key2 = `images/courses/${course.slug}/bib-2.png`;
    const cdnUrl2 = await optimizeAndUpload(img2Path, r2Key2);

    // Update MongoDB Course record
    const result = await Course.updateOne(
      { _id: course._id },
      {
        $set: {
          boxImageUrl: cdnUrl1,
          boxImage2Url: cdnUrl2,
        },
      }
    );

    console.log(`    -> MongoDB updated (modifiedCount: ${result.modifiedCount}):`);
    console.log(`       boxImageUrl: ${cdnUrl1}`);
    console.log(`       boxImage2Url: ${cdnUrl2}\n`);

    successCount++;
  }

  console.log('========================================================');
  console.log(`FINISHED! Updated ${successCount} courses with new BIB banners. Skipped: ${skippedCount}`);
  console.log('========================================================');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error during banner upload:', err);
  process.exit(1);
});
