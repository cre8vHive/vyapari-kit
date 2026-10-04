const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function normalize(str) {
  return (str || '').toLowerCase()
    .replace(/f\s*&\s*b/g, 'food and beverage')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

(async () => {
  try {
    const coursesDir = path.resolve(__dirname, '../frontend/public/images/courses');
    console.log(`Checking courses image directory: ${coursesDir}`);

    if (!fs.existsSync(coursesDir)) {
      console.error('Courses image directory does not exist.');
      process.exit(1);
    }

    const dbJsonPath = path.resolve(__dirname, '../db.json');
    const rawDb = fs.readFileSync(dbJsonPath, 'utf8');
    const dbData = JSON.parse(rawDb);
    const coursesList = Array.isArray(dbData) ? dbData : (dbData.courses || []);

    // Ensure known empty slugs are populated in db.json
    coursesList.forEach((c) => {
      if (c.title === 'Manufacturing Risks, Breakdowns & Profit Leaks Guide') c.slug = 'manufacturing-risks-breakdowns-profit-leaks-guide';
      if (c.title === 'Production SOPs, Quality Control & Waste Reduction') c.slug = 'production-sops-quality-control-waste-reduction';
      if (c.title === 'Raw Material Sourcing & Vendor Lock-In Strategy') c.slug = 'raw-material-sourcing-vendor-lock-in-strategy';
    });

    const folders = fs.readdirSync(coursesDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    console.log(`\nFound ${folders.length} course folders in directory.`);

    const updates = [];

    for (const folderName of folders) {
      const normF = normalize(folderName);

      // Match course
      let course = coursesList.find((c) => c.slug && c.slug.toLowerCase() === folderName.toLowerCase());
      if (!course) course = coursesList.find((c) => c.slug && normalize(c.slug) === normF);
      if (!course) course = coursesList.find((c) => c.title && normalize(c.title) === normF);
      if (!course) {
        course = coursesList.find((c) => {
          const nt = normalize(c.title || '');
          const ns = normalize(c.slug || '');
          return (nt.length > 5 && (nt.includes(normF) || normF.includes(nt))) ||
                 (ns.length > 5 && (ns.includes(normF) || normF.includes(ns)));
        });
      }

      if (!course) {
        console.warn(`[WARN] Could not match folder "${folderName}" to any course!`);
        continue;
      }

      const targetSlug = course.slug;
      let actualFolderName = folderName;

      // Safely rename folder to targetSlug if different
      if (folderName !== targetSlug) {
        const oldPath = path.join(coursesDir, folderName);
        const newPath = path.join(coursesDir, targetSlug);

        if (!fs.existsSync(newPath) || oldPath.toLowerCase() === newPath.toLowerCase()) {
          const tempPath = path.join(coursesDir, `__temp_${Date.now()}_${targetSlug}`);
          fs.renameSync(oldPath, tempPath);
          fs.renameSync(tempPath, newPath);
          actualFolderName = targetSlug;
        } else {
          actualFolderName = targetSlug;
        }
      }

      const folderPath = path.join(coursesDir, actualFolderName);
      const files = fs.readdirSync(folderPath)
        .filter((file) => /\.(jpe?g|png|webp|gif)$/i.test(file))
        .sort((a, b) => {
          const numA = parseInt(path.basename(a, path.extname(a)), 10);
          const numB = parseInt(path.basename(b, path.extname(b)), 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return a.localeCompare(b);
        });

      if (files.length === 0) {
        console.warn(`[WARN] No images found in folder: ${actualFolderName}`);
        continue;
      }

      const gallery = files.map((file, idx) => ({
        id: `${targetSlug}-${idx + 1}`,
        url: `/images/courses/${targetSlug}/${file}`,
        label: `${course.title} - Preview ${idx + 1}`,
        caption: `${course.title} Preview ${idx + 1}`,
        alt: `${course.title} Preview ${idx + 1}`,
      }));

      const primaryImg = `/images/courses/${targetSlug}/${files[0]}`;

      course.gallery = gallery;
      course.imageUrl = primaryImg;
      course.thumbnail = primaryImg;
      course.bannerImage = primaryImg;

      updates.push({
        slug: targetSlug,
        title: course.title,
        gallery,
        primaryImg,
      });
    }

    // Write updated courses back to db.json
    fs.writeFileSync(dbJsonPath, JSON.stringify(dbData, null, 4), 'utf8');
    console.log(`\nUpdated db.json with ${updates.length} course galleries and images.`);

    // Update MongoDB Atlas
    if (process.env.MONGODB_URI) {
      console.log('\nConnecting to MongoDB to synchronize live courses...');
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected.');

      const coursesCollection = mongoose.connection.collection('courses');
      let modifiedTotal = 0;

      for (const update of updates) {
        const result = await coursesCollection.updateOne(
          { $or: [{ slug: update.slug }, { title: update.title }] },
          {
            $set: {
              gallery: update.gallery,
              imageUrl: update.primaryImg,
              thumbnail: update.primaryImg,
              bannerImage: update.primaryImg,
            },
          }
        );
        if (result.modifiedCount > 0) modifiedTotal++;
        console.log(`[Mongo] ${update.slug}: matched ${result.matchedCount}, modified ${result.modifiedCount} (${update.gallery.length} images)`);
      }

      await mongoose.disconnect();
      console.log(`\nMongoDB synchronization finished. Total modified/updated: ${modifiedTotal}`);
    }

    console.log(`\nAll ${updates.length} courses successfully synchronized with carousel galleries!`);
  } catch (err) {
    console.error('Error synchronizing galleries:', err);
    process.exit(1);
  }
})();
