const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
require('dotenv').config({ path: path.join(__dirname, '.env') });

(async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const coursesCol = mongoose.connection.collection('courses');
    const pdfsCol = mongoose.connection.collection('coursepdfs');

    const allCourses = await coursesCol.find({}).sort({ categoryName: 1, packageType: 1, title: 1 }).toArray();
    const allPdfs = await pdfsCol.find({}).toArray();

    // Map PDFs to course IDs
    const activePdfs = allPdfs.filter((p) => !p.isDeleted);
    const pdfMap = new Map();
    for (const p of activePdfs) {
      pdfMap.set(String(p.course), p);
    }

    const missingPdfList = [];
    const withPdfList = [];
    const allList = [];

    const categoryStats = {};
    const packageStats = {};

    for (const course of allCourses) {
      if (course.isDeleted) continue;

      const courseIdStr = String(course._id);
      const matchedPdf = pdfMap.get(courseIdStr) || (course.pdfAsset ? { _id: course.pdfAsset, filename: 'Linked pdfAsset' } : null);
      const hasPdf = Boolean(matchedPdf);

      const galleryCount = Array.isArray(course.gallery) ? course.gallery.length : 0;
      const hasImages = galleryCount > 0 || Boolean(course.imageUrl && !course.imageUrl.includes('unsplash'));

      const record = {
        'Course ID': courseIdStr,
        'Course Title': course.title || '',
        'Slug': course.slug || '',
        'Category': course.categoryName || '',
        'Package Type': course.packageType || '',
        'Price (INR)': course.price || 0,
        'Has PDF': hasPdf ? 'YES' : 'NO',
        'PDF Filename': matchedPdf ? (matchedPdf.filename || 'Uploaded') : 'NOT UPLOADED',
        'Has Carousel Images': hasImages ? 'YES' : 'NO',
        'Image Count': galleryCount,
        'Status': course.isPublished ? 'Published' : 'Draft',
      };

      allList.push(record);

      const cat = course.categoryName || 'Uncategorized';
      if (!categoryStats[cat]) categoryStats[cat] = { total: 0, withPdf: 0, missingPdf: 0 };
      categoryStats[cat].total++;

      const pkg = course.packageType || 'Unassigned';
      if (!packageStats[pkg]) packageStats[pkg] = { total: 0, withPdf: 0, missingPdf: 0 };
      packageStats[pkg].total++;

      if (hasPdf) {
        withPdfList.push(record);
        categoryStats[cat].withPdf++;
        packageStats[pkg].withPdf++;
      } else {
        missingPdfList.push({
          'S.No': missingPdfList.length + 1,
          'Course Title': record['Course Title'],
          'Category': record['Category'],
          'Package Type': record['Package Type'],
          'Price (INR)': record['Price (INR)'],
          'Carousel Images': record['Has Carousel Images'],
          'Image Count': record['Image Count'],
          'Slug': record['Slug'],
          'Course ID': record['Course ID'],
          'Status': record['Status'],
        });
        categoryStats[cat].missingPdf++;
        packageStats[pkg].missingPdf++;
      }
    }

    console.log(`\nStatistics:`);
    console.log(`Total Courses: ${allList.length}`);
    console.log(`Courses With PDF: ${withPdfList.length}`);
    console.log(`Courses Missing PDF: ${missingPdfList.length}`);

    // Build workbook
    const workbook = XLSX.utils.book_new();

    // 1. Missing PDFs Sheet
    const wsMissing = XLSX.utils.json_to_sheet(missingPdfList);
    wsMissing['!cols'] = [
      { wch: 6 },  // S.No
      { wch: 65 }, // Course Title
      { wch: 18 }, // Category
      { wch: 22 }, // Package Type
      { wch: 12 }, // Price
      { wch: 16 }, // Carousel Images
      { wch: 12 }, // Image Count
      { wch: 65 }, // Slug
      { wch: 28 }, // Course ID
      { wch: 12 }, // Status
    ];
    XLSX.utils.book_append_sheet(workbook, wsMissing, 'Courses Missing PDF');

    // 2. Summary & Overview Sheet
    const summaryRows = [
      { Metric: 'Total Courses in Catalog', Count: allList.length },
      { Metric: 'Courses With PDF Uploaded', Count: withPdfList.length },
      { Metric: 'Courses Missing PDF', Count: missingPdfList.length },
      { Metric: 'PDF Coverage Ratio', Count: `${Math.round((withPdfList.length / allList.length) * 100)}%` },
      {},
      { Metric: '--- BREAKDOWN BY CATEGORY ---', Count: '' },
    ];

    Object.keys(categoryStats).sort().forEach((cat) => {
      const s = categoryStats[cat];
      summaryRows.push({
        Metric: `${cat}`,
        'Total Courses': s.total,
        'With PDF': s.withPdf,
        'Missing PDF': s.missingPdf,
      });
    });

    summaryRows.push({});
    summaryRows.push({ Metric: '--- BREAKDOWN BY PACKAGE TYPE ---', Count: '' });

    Object.keys(packageStats).sort().forEach((pkg) => {
      const s = packageStats[pkg];
      summaryRows.push({
        Metric: `${pkg}`,
        'Total Courses': s.total,
        'With PDF': s.withPdf,
        'Missing PDF': s.missingPdf,
      });
    });

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary['!cols'] = [
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Summary Overview');

    // 3. Complete Catalog Sheet (All Courses)
    const wsAll = XLSX.utils.json_to_sheet(
      allList.map((r, i) => ({ 'S.No': i + 1, ...r }))
    );
    wsAll['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 65 },
      { wch: 65 },
      { wch: 18 },
      { wch: 22 },
      { wch: 12 },
      { wch: 10 },
      { wch: 30 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(workbook, wsAll, 'Complete Catalog');

    // Save Excel file to root
    let outputPath = path.resolve(__dirname, '../courses_without_pdfs_latest.xlsx');
    XLSX.writeFile(workbook, outputPath);
    console.log(`\nSuccessfully generated Excel spreadsheet: ${outputPath}`);

    // Also write CSV
    let csvPath = path.resolve(__dirname, '../courses_without_pdfs_latest.csv');
    const csvContent = XLSX.utils.sheet_to_csv(wsMissing);
    fs.writeFileSync(csvPath, csvContent, 'utf8');
    console.log(`Successfully generated CSV file: ${csvPath}`);

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error generating Excel file:', err);
    process.exit(1);
  }
})();
