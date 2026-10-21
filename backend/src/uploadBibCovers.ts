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
  return (s || '').toLowerCase()
    .replace(/business\s+in\s+a\s+box/gi, '')
    .replace(/profit\s+blueprint/gi, '')
    .replace(/[^a-z0-9]/g, '');
}

async function optimizeAndUpload(
  filePath: string,
  r2Key: string
): Promise<string> {
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

  const bibDir = path.resolve('../frontend/src/assets/BIB');
  if (!fs.existsSync(bibDir)) {
    throw new Error(`Directory not found: ${bibDir}`);
  }

  const files = fs.readdirSync(bibDir).filter((f) => f.toLowerCase().endsWith('.png'));
  console.log(`Found ${files.length} BIB cover images to process.\n`);

  let successCount = 0;
  let skippedCount = 0;

  for (let idx = 0; idx < files.length; idx++) {
    const fileName = files[idx];
    const filePath = path.join(bibDir, fileName);
    const fNorm = norm(fileName);

    let course = planCourses.find((c) => norm(c.title) === fNorm || norm(c.slug) === fNorm);
    if (!course) {
      course = planCourses.find((c) => {
        const cNormT = norm(c.title);
        const cNormS = norm(c.slug);
        return (
          fNorm.length > 5 &&
          (cNormT.includes(fNorm) || fNorm.includes(cNormT) || cNormS.includes(fNorm) || fNorm.includes(cNormS))
        );
      });
    }

    if (!course) {
      console.warn(`[SKIP] No course match for: "${fileName}"`);
      skippedCount++;
      continue;
    }

    console.log(`[${idx + 1}/${files.length}] Processing: "${fileName}"`);
    console.log(`    Matched to: "${course.title}" (${course.slug})`);

    const r2Key = `images/courses/${course.slug}/bib-cover.png`;
    const cdnUrl = await optimizeAndUpload(filePath, r2Key);

    // Update MongoDB Course with boxImageUrl
    const result = await Course.updateOne(
      { _id: course._id },
      { $set: { boxImageUrl: cdnUrl } }
    );

    console.log(`    -> MongoDB updated (modifiedCount: ${result.modifiedCount}): ${cdnUrl}\n`);
    successCount++;
  }

  console.log('========================================================');
  console.log(`DONE! Successfully uploaded & updated ${successCount} BIB covers. (Skipped: ${skippedCount})`);
  console.log('========================================================');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Fatal error during BIB cover upload:', err);
  process.exit(1);
});
