const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
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
  await mongoose.connect(process.env.MONGODB_URI);
  const coursesCol = mongoose.connection.collection('courses');
  const pdfsCol = mongoose.connection.collection('coursepdfs');

  const existingPdfs = await pdfsCol.find({}).toArray();
  const existingPdfCourseIds = new Set(existingPdfs.filter((p) => !p.isDeleted).map((p) => String(p.course)));

  const allCourses = await coursesCol.find({}).toArray();
  const missingCourses = allCourses.filter((c) => !c.isDeleted && !existingPdfCourseIds.has(String(c._id)) && !c.pdfAsset);

  console.log('Total Missing Courses:', missingCourses.length);

  const files = fs.readdirSync(path.resolve(__dirname, '../new_pdfs')).filter((f) => /\.pdf$/i.test(f));
  console.log('Total PDF Files in new_pdfs:', files.length);

  const matched = [];
  const unmatched = [];
  const matchedCourseIds = new Set();

  for (const file of files) {
    const normFile = normalize(file);
    let course = missingCourses.find((c) => c.slug && c.slug.toLowerCase() === normFile);
    if (!course) course = missingCourses.find((c) => c.slug && normalize(c.slug) === normFile);
    if (!course) course = missingCourses.find((c) => c.title && normalize(c.title) === normFile);
    if (!course) {
      course = missingCourses.find((c) => {
        const nt = normalize(c.title || '');
        const ns = normalize(c.slug || '');
        return (nt.length > 5 && (nt.includes(normFile) || normFile.includes(nt))) ||
               (ns.length > 5 && (ns.includes(normFile) || normFile.includes(ns)));
      });
    }

    if (course) {
      matched.push({ file, title: course.title, slug: course.slug });
      matchedCourseIds.add(String(course._id));
    } else {
      unmatched.push(file);
    }
  }

  console.log(`\n--- MATCHED (${matched.length}) ---`);
  matched.forEach((m) => console.log(`[OK] ${m.file} ==> ${m.title} (${m.slug})`));

  if (unmatched.length > 0) {
    console.log(`\n--- UNMATCHED FILES (${unmatched.length}) ---`);
    unmatched.forEach((u) => console.log(`[UNMATCHED] ${u}`));
  }

  const stillMissing = missingCourses.filter((c) => !matchedCourseIds.has(String(c._id)));
  console.log(`\n--- STILL MISSING (${stillMissing.length}) ---`);
  stillMissing.forEach((c) => console.log(`[MISSING] ${c.title} (${c.slug})`));

  await mongoose.disconnect();
})();
