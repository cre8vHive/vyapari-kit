const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

(async () => {
  try {
    console.log('--- REVERTING CHANGES FROM BACKUP ---');
    
    if (!fs.existsSync('./backup_courses_before_mapping.json') || !fs.existsSync('./backup_coursepdfs_before_mapping.json')) {
      console.error('Backup files not found! Cannot automatically revert.');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const coursesCollection = mongoose.connection.collection('courses');
    const coursePdfsCollection = mongoose.connection.collection('coursepdfs');

    const backupCourses = JSON.parse(fs.readFileSync('./backup_courses_before_mapping.json', 'utf8'));
    const backupPdfs = JSON.parse(fs.readFileSync('./backup_coursepdfs_before_mapping.json', 'utf8'));

    console.log(`Restoring ${backupCourses.length} courses...`);
    for (const c of backupCourses) {
      const id = new mongoose.Types.ObjectId(c._id);
      delete c._id;
      if (c.pdfAsset) c.pdfAsset = new mongoose.Types.ObjectId(c.pdfAsset);
      await coursesCollection.replaceOne({ _id: id }, c, { upsert: true });
    }

    console.log(`Restoring ${backupPdfs.length} coursepdfs...`);
    await coursePdfsCollection.deleteMany({});
    for (const p of backupPdfs) {
      p._id = new mongoose.Types.ObjectId(p._id);
      if (p.course) p.course = new mongoose.Types.ObjectId(p.course);
      if (p.createdBy) p.createdBy = new mongoose.Types.ObjectId(p.createdBy);
      if (p.updatedBy) p.updatedBy = new mongoose.Types.ObjectId(p.updatedBy);
      await coursePdfsCollection.insertOne(p);
    }

    if (fs.existsSync('../db.backup.json')) {
      fs.copyFileSync('../db.backup.json', '../db.json');
      console.log('Restored db.json from db.backup.json');
    }

    console.log('REVERT COMPLETED SUCCESSFULLY! All database records and files are restored to their original state.');
  } catch (err) {
    console.error('Rollback error:', err);
  } finally {
    await mongoose.disconnect();
  }
})();
