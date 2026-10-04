const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

(async () => {
  try {
    console.log('--- STEP 1: Connecting to MongoDB ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connection established.');

    const coursesCollection = mongoose.connection.collection('courses');
    const coursePdfsCollection = mongoose.connection.collection('coursepdfs');

    // 1. Create a full backup of courses and coursepdfs
    console.log('\n--- STEP 2: Creating Safety Backups ---');
    const allCourses = await coursesCollection.find({}).toArray();
    const allCoursePdfs = await coursePdfsCollection.find({}).toArray();

    fs.writeFileSync('./backup_courses_before_mapping.json', JSON.stringify(allCourses, null, 2), 'utf8');
    fs.writeFileSync('./backup_coursepdfs_before_mapping.json', JSON.stringify(allCoursePdfs, null, 2), 'utf8');
    fs.copyFileSync('../db.json', '../db.backup.json');
    console.log(`Backed up ${allCourses.length} courses to backend/backup_courses_before_mapping.json`);
    console.log(`Backed up ${allCoursePdfs.length} coursepdfs to backend/backup_coursepdfs_before_mapping.json`);
    console.log('Backed up db.json to db.backup.json');

    // 2. Parse the CSV mapping preview
    console.log('\n--- STEP 3: Reading CSV Mapping ---');
    const csvContent = fs.readFileSync('../mapping_preview.csv', 'utf8').replace(/^\uFEFF/, '');
    const lines = csvContent.split('\n');

    const mappedItems = [];
    for (const line of lines) {
      if (!line.trim() || line.startsWith('Number,') || line.startsWith('=')) {
        if (line.startsWith('=')) break; // stop at Section 2
        continue;
      }

      // Parse CSV line handling quotes
      const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
      const cols = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match.index === regex.lastIndex) regex.lastIndex++;
        const val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
        cols.push(val);
      }

      const num = parseInt(cols[0]);
      const hasImage = cols[1];
      const hasPdf = cols[2];
      const matchedTitle = cols[3];
      const status = cols[4];
      const imageUrl = cols[9];
      const pdfUrl = cols[10];

      if (num && matchedTitle && matchedTitle !== '--- Pending Review / Unassigned ---') {
        mappedItems.push({
          num,
          hasImage: hasImage === 'YES',
          hasPdf: hasPdf === 'YES',
          title: matchedTitle,
          status,
          imageUrl,
          pdfUrl
        });
      }
    }

    console.log(`Found ${mappedItems.length} approved mappings from CSV.`);

    // 3. Apply updates to MongoDB
    console.log('\n--- STEP 4: Applying Updates to MongoDB ---');
    let coursesUpdated = 0;
    let pdfsCreatedOrUpdated = 0;
    const notFoundTitles = [];

    for (const item of mappedItems) {
      // Find course in MongoDB by title (case-insensitive exact or trimmed)
      const course = await coursesCollection.findOne({
        title: { $regex: new RegExp('^' + item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
      });

      if (!course) {
        notFoundTitles.push(item.title);
        console.warn(`[WARNING] Course not found in MongoDB: "${item.title}"`);
        continue;
      }

      const updateFields = {};
      if (item.hasImage && item.imageUrl) {
        updateFields.imageUrl = item.imageUrl;
        updateFields.thumbnail = item.imageUrl;
        updateFields.bannerImage = item.imageUrl;
      }

      if (item.hasPdf && item.pdfUrl) {
        // Upsert CoursePdf document
        let coursePdf = await coursePdfsCollection.findOne({ course: course._id });
        if (!coursePdf) {
          const insertRes = await coursePdfsCollection.insertOne({
            course: course._id,
            storageType: 'external',
            filename: `${item.num}.pdf`,
            mimeType: 'application/pdf',
            externalUrl: item.pdfUrl,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          updateFields.pdfAsset = insertRes.insertedId;
          pdfsCreatedOrUpdated++;
        } else {
          await coursePdfsCollection.updateOne(
            { _id: coursePdf._id },
            {
              $set: {
                storageType: 'external',
                filename: `${item.num}.pdf`,
                externalUrl: item.pdfUrl,
                mimeType: 'application/pdf',
                isDeleted: false,
                updatedAt: new Date()
              }
            }
          );
          updateFields.pdfAsset = coursePdf._id;
          pdfsCreatedOrUpdated++;
        }
      }

      updateFields.updatedAt = new Date();

      await coursesCollection.updateOne(
        { _id: course._id },
        { $set: updateFields }
      );
      coursesUpdated++;
      console.log(`[#${item.num}] Updated course: "${course.title.slice(0, 45)}..." (Img: ${item.hasImage ? 'YES' : 'NO'}, PDF: ${item.hasPdf ? 'YES' : 'NO'})`);
    }

    // 4. Update db.json
    console.log('\n--- STEP 5: Syncing db.json ---');
    const dbCourses = JSON.parse(fs.readFileSync('../db.json', 'utf8'));
    let dbUpdated = 0;
    for (const item of mappedItems) {
      const match = dbCourses.find(c => c.title.trim().toLowerCase() === item.title.trim().toLowerCase());
      if (match) {
        if (item.hasImage && item.imageUrl) {
          match.imageUrl = item.imageUrl;
          match.thumbnail = item.imageUrl;
        }
        if (item.hasPdf && item.pdfUrl) {
          match.pdfUrl = item.pdfUrl;
        }
        dbUpdated++;
      }
    }
    fs.writeFileSync('../db.json', JSON.stringify(dbCourses, null, 2), 'utf8');
    console.log(`Updated ${dbUpdated} course entries in db.json.`);

    console.log('\n======================================================');
    console.log('SUMMARY:');
    console.log(`- Courses updated in MongoDB: ${coursesUpdated}`);
    console.log(`- CoursePdfs created/updated in MongoDB: ${pdfsCreatedOrUpdated}`);
    console.log(`- Courses updated in db.json: ${dbUpdated}`);
    if (notFoundTitles.length > 0) {
      console.log(`- Not found in DB: ${notFoundTitles.length} courses`);
    }
    console.log('======================================================');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
})();
