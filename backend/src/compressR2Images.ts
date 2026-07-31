import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { config } from 'dotenv';
config();

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const Bucket = process.env.R2_BUCKET_NAME || 'vyapari-kit-media';

async function main() {
  console.log(`Listing objects in bucket: ${Bucket}, prefix: course-images/`);
  const listCmd = new ListObjectsV2Command({
    Bucket,
    Prefix: 'course-images/',
  });
  const res = await s3Client.send(listCmd);
  
  if (!res.Contents || res.Contents.length === 0) {
    console.log('No images found.');
    return;
  }
  
  console.log(`Found ${res.Contents.length} images. Starting compression...`);

  for (const obj of res.Contents) {
    if (!obj.Key || !obj.Key.endsWith('.png')) continue;
    
    const sizeMb = (obj.Size || 0) / 1024 / 1024;
    // Skip if already small (e.g., < 300KB)
    if (sizeMb < 0.3) {
      console.log(`Skipping ${obj.Key} (Already small: ${sizeMb.toFixed(2)} MB)`);
      continue;
    }

    console.log(`Processing ${obj.Key} (Original Size: ${sizeMb.toFixed(2)} MB)`);
    
    try {
      // 1. Download
      const getCmd = new GetObjectCommand({ Bucket, Key: obj.Key });
      const getRes = await s3Client.send(getCmd);
      const stream = getRes.Body as any;
      if (!stream) continue;
      
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);
      
      // 2. Compress (resize if huge, optimize PNG)
      const compressedBuffer = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true }) // Prevent giant dimensions
        .png({ quality: 60, compressionLevel: 9, effort: 8 })
        .toBuffer();
        
      const newSizeMb = compressedBuffer.length / 1024 / 1024;
      console.log(`  -> Compressed Size: ${newSizeMb.toFixed(2)} MB`);
      
      if (compressedBuffer.length < buffer.length) {
        // 3. Upload back
        const putCmd = new PutObjectCommand({
          Bucket,
          Key: obj.Key,
          Body: compressedBuffer,
          ContentType: 'image/png'
        });
        await s3Client.send(putCmd);
        console.log(`  -> Replaced ${obj.Key} in R2 successfully.`);
      } else {
        console.log(`  -> Already compressed optimally.`);
      }
    } catch (err) {
      console.error(`Error processing ${obj.Key}:`, err);
    }
  }
  console.log('Finished compressing all images!');
}

main().catch(console.error);
