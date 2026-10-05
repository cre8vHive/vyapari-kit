import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
loadEnv();

const CDN_BASE = 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev';

function replaceUrls(obj: any): boolean {
  let changed = false;
  if (!obj || typeof obj !== 'object') return false;

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && val.startsWith('/images/')) {
      obj[key] = `${CDN_BASE}${val}`;
      changed = true;
    } else if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        if (typeof val[i] === 'string' && val[i].startsWith('/images/')) {
          val[i] = `${CDN_BASE}${val[i]}`;
          changed = true;
        } else if (typeof val[i] === 'object') {
          if (replaceUrls(val[i])) changed = true;
        }
      }
    } else if (typeof val === 'object' && val !== null) {
      if (replaceUrls(val)) changed = true;
    }
  }
  return changed;
}

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected.');

  const collection = mongoose.connection.collection('courses');
  const allCourses = await collection.find({}).toArray();
  console.log(`Checking ${allCourses.length} courses in raw MongoDB collection...`);

  let updatedCount = 0;
  for (const course of allCourses) {
    const copy = { ...course };
    if (replaceUrls(copy)) {
      await collection.replaceOne({ _id: course._id }, copy);
      updatedCount++;
      console.log(`Updated course: ${course.title || course.slug}`);
    }
  }

  console.log(`Finished updating ${updatedCount} courses in MongoDB!`);
  await mongoose.disconnect();
}

main().catch(console.error);
