const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const dbJsonPath = path.resolve(__dirname, '../db.json');
const dbBackupPath = path.resolve(__dirname, '../db.backup_before_citation_clean.json');

function cleanText(val) {
  if (typeof val === 'string') {
    return val.replace(/\s*\[cite:[^\]]+\]/g, '').trimEnd();
  }
  if (Array.isArray(val)) {
    return val.map(cleanText);
  }
  if (val && typeof val === 'object') {
    const res = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = cleanText(v);
    }
    return res;
  }
  return val;
}

async function run() {
  console.log('=== STEP 1: Cleaning db.json ===');
  if (fs.existsSync(dbJsonPath)) {
    const raw = fs.readFileSync(dbJsonPath, 'utf8');
    const matchCount = (raw.match(/\[cite:[^\]]+\]/g) || []).length;
    console.log(`Found ${matchCount} citation markers in db.json`);

    // Backup original db.json
    fs.writeFileSync(dbBackupPath, raw, 'utf8');
    console.log(`Created backup at: ${dbBackupPath}`);

    const cleanedRaw = raw.replace(/\s*\[cite:[^\]]+\]/g, '');
    fs.writeFileSync(dbJsonPath, cleanedRaw, 'utf8');
    console.log(`Successfully updated db.json! Remaining citations: ${(cleanedRaw.match(/\[cite:[^\]]+\]/g) || []).length}`);
  } else {
    console.warn('db.json not found!');
  }

  console.log('\n=== STEP 2: Cleaning MongoDB Atlas ===');
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('No MONGODB_URI found in backend/.env, skipping MongoDB cleanup.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas.');

    const Course = mongoose.model('Course', new mongoose.Schema({}, { strict: false }));
    const allCourses = await Course.find({});
    console.log(`Found ${allCourses.length} total courses in MongoDB.`);

    let updatedCount = 0;
    let totalCitationsRemoved = 0;

    for (const doc of allCourses) {
      let docModified = false;
      const fields = ['title', 'description', 'overview', 'includes', 'audience', 'learnings', 'faqs'];

      for (const field of fields) {
        const val = doc.get(field);
        if (!val) continue;

        const originalStr = JSON.stringify(val);
        const matches = (originalStr.match(/\[cite:[^\]]+\]/g) || []).length;
        if (matches > 0) {
          totalCitationsRemoved += matches;
          const cleanedVal = cleanText(val);
          doc.set(field, cleanedVal);
          docModified = true;
        }
      }

      if (docModified) {
        await doc.save();
        updatedCount++;
      }
    }

    console.log(`MongoDB Cleanup Complete!`);
    console.log(`Updated ${updatedCount} courses in MongoDB.`);
    console.log(`Total citation tags stripped from MongoDB: ${totalCitationsRemoved}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (err) {
    console.error('Error during MongoDB cleanup:', err.message);
  }
}

run();
