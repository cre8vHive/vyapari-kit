import fs from 'fs';
import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
loadEnv();
import { config } from './config';
import Course from './models/Course';
import { createRequire } from 'module';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const pdfParse = pdf.default || pdf;

const IMAGE_BASE_URL = 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/'; 

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ''
  }
});

async function main() {
  console.log('Fetching objects from R2...');
  const Bucket = process.env.R2_BUCKET_NAME || 'vyapari-kit-media';
  const listRes = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: 'course-images/' }));
  const objects = (listRes.Contents || []).map(c => c.Key || '');
  
  // Create a map from number -> object key
  // e.g. "course-images/50 .jpeg" -> "50"
  const imageMap = new Map<string, string>();
  for (const obj of objects) {
    const match = obj.match(/course-images\/(\d+)[^/]*$/);
    if (match) {
      imageMap.set(match[1], obj);
    }
  }
  
  console.log(`Found ${objects.length} images in R2.`);

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || config.mongodbUri || 'mongodb://localhost:27017/vyaparikit');
  console.log('Connected.');

  const pdfPath = 'C:/Users/aladi/.gemini/antigravity-ide/brain/4c132556-0aa2-47bd-954b-d83deb4d66b3/media__1785418034343.pdf';
  console.log('Reading PDF:', pdfPath);
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);

  const rawText = data.text;

  // Split by course title pattern but keep the number
  const courseBlocks = rawText.split(/\n(\d+)\.\s+/);
  courseBlocks.shift(); // Remove the garbage before the first number

  let updatedCount = 0;

  for (let i = 0; i < courseBlocks.length; i += 2) {
    const number = courseBlocks[i];
    const block = courseBlocks[i + 1];

    const lines = block.split('\n').map(l => l.trim()).filter(l => l);

    let currentSection = '';
    let title = '';

    // Extract just the Title to find the corresponding course in the database
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      if (['Title', 'Subtitle', 'Rating', 'Language', 'Category'].includes(line)) {
        currentSection = line;
      } else if (currentSection === 'Title' && !title) {
        title = line;
      }
    }

    if (title) {
      const r2Key = imageMap.get(number);
      if (r2Key) {
        // Construct the full URL, being careful to encode spaces properly for the URL
        const imageUrl = `${IMAGE_BASE_URL}${encodeURIComponent(r2Key).replace(/%2F/g, '/')}`;
        try {
          const result = await Course.updateOne(
            { title: title },
            { $set: { imageUrl: imageUrl } }
          );
          if (result.modifiedCount > 0) {
            console.log(`Linked image ${r2Key} to course: ${title}`);
            updatedCount++;
          }
        } catch (err) {
          console.error(`Failed to update ${title}:`, err);
        }
      } else {
         console.warn(`No image found in R2 for course number ${number} (${title})`);
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} courses with image URLs.`);
  await mongoose.disconnect();
}

main().catch(console.error);
