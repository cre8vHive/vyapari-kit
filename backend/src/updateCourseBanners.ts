import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
loadEnv();

import Course from './models/Course.js';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB.');

  const courses = await Course.find({ 'gallery.0': { $exists: true } });
  console.log(`Found ${courses.length} courses with gallery items.`);

  let updatedCount = 0;
  for (const course of courses) {
    if (course.gallery && course.gallery.length > 0) {
      const bannerUrl = course.gallery[0].url;
      if (bannerUrl) {
        course.imageUrl = bannerUrl;
        course.thumbnail = bannerUrl;
        course.bannerImage = bannerUrl;
        await course.save();
        updatedCount++;
        console.log(`[UPDATED] "${course.title}" -> ${bannerUrl}`);
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} courses with banner/thumbnail images!`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error updating course banners:', err);
  process.exit(1);
});
