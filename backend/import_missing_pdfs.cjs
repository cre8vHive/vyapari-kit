const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: path.join(__dirname, '.env') });

function normalize(str) {
  return (str || '').toLowerCase()
    .replace(/\.pdf$/i, '')
    .replace(/f\s*&\s*b/g, 'food and beverage')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

(async () => {
  try {
    const newPdfsDir = path.resolve(__dirname, '../new_pdfs');
    console.log(`Checking incoming PDFs directory: ${newPdfsDir}`);

    if (!fs.existsSync(newPdfsDir)) {
      fs.mkdirSync(newPdfsDir, { recursive: true });
    }

    const files = fs.readdirSync(newPdfsDir).filter((f) => /\.pdf$/i.test(f));
    console.log(`Found ${files.length} PDF files in new_pdfs directory.`);

    if (files.length === 0) {
      console.log('No PDF files found yet. Please place the PDF files into "new_pdfs" folder and run this script.');
      process.exit(0);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected.');

    const coursesCol = mongoose.connection.collection('courses');
    const pdfsCol = mongoose.connection.collection('coursepdfs');

    // 1. Safety backup of existing records before any operation
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(__dirname, './backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const existingPdfs = await pdfsCol.find({}).toArray();
    fs.writeFileSync(path.join(backupDir, `pdfs_backup_${timestamp}.json`), JSON.stringify(existingPdfs, null, 2), 'utf8');
    console.log(`[Safety Backup] Backed up ${existingPdfs.length} existing PDF records.`);

    // Existing active PDF course IDs - these will NEVER be modified or touched
    const existingPdfCourseIds = new Set(
      existingPdfs.filter((p) => !p.isDeleted).map((p) => String(p.course))
    );
    console.log(`[Safety Check] ${existingPdfCourseIds.size} courses already have PDFs. They are PROTECTED and will not be touched.`);

    // All active courses in database
    const allCourses = await coursesCol.find({ isDeleted: { $ne: true } }).toArray();

    // Candidates: Only courses that are MISSING a PDF
    const missingPdfCourses = allCourses.filter(
      (c) => !existingPdfCourseIds.has(String(c._id)) && !c.pdfAsset
    );
    console.log(`Found ${missingPdfCourses.length} courses currently missing a PDF.`);

    // Setup Cloudflare R2 Client
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });

    const bucketName = process.env.R2_BUCKET_NAME || 'vyapari-kit-media';
    const publicUrlBase = (process.env.R2_PUBLIC_URL || 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev').replace(/\/+$/, '');

    const uploaded = [];
    const unmatched = [];

    for (const file of files) {
      const normFile = normalize(file);

      // Match against missing courses ONLY
      let course = missingPdfCourses.find((c) => c.slug && c.slug.toLowerCase() === normFile);
      if (!course) course = missingPdfCourses.find((c) => c.slug && normalize(c.slug) === normFile);
      if (!course) course = missingPdfCourses.find((c) => c.title && normalize(c.title) === normFile);
      if (!course) {
        course = missingPdfCourses.find((c) => {
          const nt = normalize(c.title || '');
          const ns = normalize(c.slug || '');
          return (nt.length > 5 && (nt.includes(normFile) || normFile.includes(nt))) ||
                 (ns.length > 5 && (ns.includes(normFile) || normFile.includes(ns)));
        });
      }

      if (!course) {
        unmatched.push(file);
        console.warn(`[UNMATCHED] Could not match PDF: "${file}"`);
        continue;
      }

      console.log(`\n[MATCH] "${file}" -> "${course.title}" (${course.slug})`);

      const filePath = path.join(newPdfsDir, file);
      const fileBuffer = fs.readFileSync(filePath);
      const r2Key = `uploads/pdfs/${course.slug}.pdf`;

      console.log(`Uploading to R2: ${r2Key} (${(fileBuffer.length / 1024).toFixed(1)} KB)...`);

      // Upload to R2
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: 'application/pdf',
        })
      );

      const externalUrl = `${publicUrlBase}/${r2Key}`;
      console.log(`Uploaded: ${externalUrl}`);

      // Create CoursePdf document
      const newPdfDoc = {
        course: course._id,
        storageType: 'external',
        filename: `${course.slug}.pdf`,
        mimeType: 'application/pdf',
        fileSize: fileBuffer.length,
        externalUrl: externalUrl,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertResult = await pdfsCol.insertOne(newPdfDoc);
      const newPdfId = insertResult.insertedId;

      // Link to course
      await coursesCol.updateOne(
        { _id: course._id },
        {
          $set: {
            pdfAsset: newPdfId,
            hasPdf: true,
            updatedAt: new Date(),
          },
        }
      );

      uploaded.push({
        file,
        courseTitle: course.title,
        slug: course.slug,
        pdfId: newPdfId,
        url: externalUrl,
      });

      console.log(`[Success] Linked PDF to course "${course.title}".`);
    }

    // Update db.json
    try {
      const dbJsonPath = path.resolve(__dirname, '../db.json');
      const rawDb = fs.readFileSync(dbJsonPath, 'utf8');
      const dbData = JSON.parse(rawDb);
      const coursesList = Array.isArray(dbData) ? dbData : (dbData.courses || []);

      for (const item of uploaded) {
        const found = coursesList.find((c) => c.slug === item.slug);
        if (found) {
          found.pdfAsset = String(item.pdfId);
          found.hasPdf = true;
        }
      }

      fs.writeFileSync(dbJsonPath, JSON.stringify(dbData, null, 4), 'utf8');
      console.log(`Updated db.json with ${uploaded.length} newly uploaded PDFs.`);
    } catch (e) {
      console.warn('Warning: Could not update db.json:', e.message);
    }

    console.log(`\n========================================`);
    console.log(`UPLOAD SUMMARY:`);
    console.log(`- Successfully uploaded & linked: ${uploaded.length}`);
    console.log(`- Unmatched files:               ${unmatched.length}`);
    if (unmatched.length > 0) {
      console.log(`Unmatched files:`, unmatched);
    }
    console.log(`========================================\n`);

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error importing missing PDFs:', err);
    process.exit(1);
  }
})();
