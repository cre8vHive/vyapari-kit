import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
loadEnv();
import Course from './models/Course';

const CDN_BASE = 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev';

async function updateDbJson() {
  const dbJsonPath = path.resolve(process.cwd(), '../db.json');
  if (fs.existsSync(dbJsonPath)) {
    console.log('Updating db.json...');
    let content = fs.readFileSync(dbJsonPath, 'utf8');
    
    // Replace image paths with CDN base
    content = content.replace(/"\/images\//g, `"${CDN_BASE}/images/`);
    
    // Remove "UPDATED 2026 EDITION"
    content = content.replace(/"editionNote":\s*"UPDATED\s*2026\s*EDITION"/gi, '"editionNote": ""');
    content = content.replace(/"editionNote":\s*".*?2026.*?"/gi, '"editionNote": ""');

    fs.writeFileSync(dbJsonPath, content, 'utf8');
    console.log('db.json updated successfully!');
  }
}

async function updateMongoDb() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('No MONGODB_URI found, skipping MongoDB direct update.');
    return;
  }

  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses in MongoDB.`);

    let updatedCount = 0;
    for (const course of courses) {
      let modified = false;

      // Update imageUrl
      if (course.imageUrl && course.imageUrl.startsWith('/images/')) {
        course.imageUrl = `${CDN_BASE}${course.imageUrl}`;
        modified = true;
      }

      // Update gallery URLs
      if (course.gallery && Array.isArray(course.gallery)) {
        for (const item of course.gallery) {
          if (item && item.url && item.url.startsWith('/images/')) {
            item.url = `${CDN_BASE}${item.url}`;
            modified = true;
          }
        }
      }

      // Clear "updated 2026" editionNote
      if (course.editionNote && /2026/i.test(course.editionNote)) {
        course.editionNote = '';
        modified = true;
      }

      if (modified) {
        await course.save();
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} courses in MongoDB.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('MongoDB update error:', err);
  }
}

async function main() {
  await updateDbJson();
  await updateMongoDb();
}

main().catch(console.error);
