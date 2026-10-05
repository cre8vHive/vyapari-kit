import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { config as loadEnv } from 'dotenv';
loadEnv();

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const Bucket = process.env.R2_BUCKET_NAME || 'vyapari-kit-media';
const IMAGES_DIR = path.resolve(process.cwd(), '../frontend/public/images');

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

async function uploadFile(filePath: string): Promise<void> {
  const relPath = path.relative(path.resolve(process.cwd(), '../frontend/public'), filePath).replace(/\\/g, '/');
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || 'application/octet-stream';
  const fileContent = fs.readFileSync(filePath);

  // Check if already uploaded and size matches
  try {
    const head = await s3Client.send(new HeadObjectCommand({ Bucket, Key: relPath }));
    if (head.ContentLength === fileContent.length) {
      console.log(`[SKIP] Already exists: ${relPath}`);
      return;
    }
  } catch (e) {
    // Doesn't exist, proceed to upload
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket,
      Key: relPath,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  console.log(`[UPLOADED] ${relPath} (${contentType})`);
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error('Directory does not exist:', IMAGES_DIR);
    process.exit(1);
  }

  const files = getAllFiles(IMAGES_DIR);
  console.log(`Found ${files.length} images to sync to Cloudflare R2 (${Bucket})...`);

  const concurrency = 15;
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    await Promise.all(batch.map((f) => uploadFile(f)));
  }

  console.log('All images uploaded successfully to Cloudflare R2!');
}

main().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
