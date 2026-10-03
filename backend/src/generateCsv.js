const fs = require('fs');
const pdf = require('pdf-parse');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: './.env' });

(async () => {
  console.log('1. Reading master document...');
  const masterPdfPath = 'C:/Users/aladi/.gemini/antigravity-ide/brain/4c132556-0aa2-47bd-954b-d83deb4d66b3/media__1785418034343.pdf';
  const data = await pdf(fs.readFileSync(masterPdfPath));
  const blocks = data.text.split(/\n(\d+)\.\s+/);
  blocks.shift();

  const masterItems = new Map();
  for (let i = 0; i < blocks.length; i += 2) {
    const num = parseInt(blocks[i]);
    const text = blocks[i + 1];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const titleIdx = lines.indexOf('Title');
    const title = titleIdx !== -1 ? lines[titleIdx + 1] : lines[0];
    const subIdx = lines.indexOf('Subtitle');
    const subtitle = subIdx !== -1 ? lines[subIdx + 1] : '';
    const catIdx = lines.indexOf('Category');
    const category = catIdx !== -1 ? lines[catIdx + 1] : '';
    masterItems.set(num, { num, title, subtitle, category });
  }
  console.log('Extracted', masterItems.size, 'master items from PDF.');

  console.log('2. Checking Cloudflare R2 bucket...');
  const s3 = new S3Client({
    region: 'auto',
    endpoint: 'https://' + process.env.R2_ACCOUNT_ID + '.r2.cloudflarestorage.com',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
  const Bucket = process.env.R2_BUCKET_NAME || 'vyapari-kit-media';

  const r2Images = new Set();
  const r2Pdfs = new Set();

  let isTruncated = true;
  let token;
  while (isTruncated) {
    const res = await s3.send(new ListObjectsV2Command({ Bucket, ContinuationToken: token }));
    (res.Contents || []).forEach(c => {
      const k = c.Key || '';
      const mImg = k.match(/course-images\/(\d+)\./);
      if (mImg) r2Images.add(parseInt(mImg[1]));
      const mPdf = k.match(/uploads\/pdfs\/(\d+)\.pdf$/);
      if (mPdf) r2Pdfs.add(parseInt(mPdf[1]));
    });
    isTruncated = res.IsTruncated;
    token = res.NextContinuationToken;
  }
  console.log('Found', r2Images.size, 'images and', r2Pdfs.size, 'PDFs in R2.');

  console.log('3. Loading db.json courses...');
  const dbCourses = JSON.parse(fs.readFileSync('../db.json', 'utf8'));
  console.log('Total DB courses:', dbCourses.length);

  const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'business', 'plan', 'playbook', 'guide', 'blueprint', 'in', 'india', 'to', 'a', 'of', 'how', 'build', 'scale', 'profitable', 'kit']);
  const getKeywords = (str) => {
    return str.toLowerCase().replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  };

  const matchedDbIndexes = new Set();
  const results = [];

  for (let num = 1; num <= 96; num++) {
    const master = masterItems.get(num) || { num, title: 'Item #' + num, subtitle: '', category: '' };
    const hasImg = r2Images.has(num);
    const hasPdf = r2Pdfs.has(num);

    const masterKeywords = getKeywords(master.title + ' ' + master.subtitle);

    let bestMatch = null;
    let bestScore = 0;
    let bestIdx = -1;

    for (let idx = 0; idx < dbCourses.length; idx++) {
      if (matchedDbIndexes.has(idx)) continue;
      const course = dbCourses[idx];
      const courseKeywords = getKeywords(course.title + ' ' + (course.subtitle || ''));

      let common = 0;
      for (const kw of masterKeywords) {
        if (courseKeywords.includes(kw)) common++;
      }

      const catMatch = master.category && course.category && master.category.toLowerCase().includes(course.category.toLowerCase().slice(0, 4));
      
      const cleanMasterTitle = master.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanCourseTitle = course.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isExact = cleanMasterTitle === cleanCourseTitle || cleanCourseTitle.includes(cleanMasterTitle) || cleanMasterTitle.includes(cleanCourseTitle);

      let score = common / Math.max(1, Math.min(masterKeywords.length, courseKeywords.length));
      if (isExact) score = 1.0;
      else if (catMatch) score += 0.15;

      if (score > bestScore && score >= 0.25) {
        bestScore = score;
        bestMatch = course;
        bestIdx = idx;
      }
    }

    if (bestMatch && bestScore >= 0.25) {
      matchedDbIndexes.add(bestIdx);
      results.push({
        number: num,
        hasImage: hasImg ? 'YES' : 'NO',
        hasPdf: hasPdf ? 'YES' : 'NO',
        imageUrl: hasImg ? 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/course-images/' + num + '.png' : '',
        pdfUrl: hasPdf ? 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/uploads/pdfs/' + num + '.pdf' : '',
        masterTitle: master.title,
        matchedTitle: bestMatch.title,
        packageType: bestMatch.type || bestMatch.packageType || '',
        category: bestMatch.category || bestMatch.categoryName || '',
        confidence: bestScore >= 0.75 ? 'HIGH' : (bestScore >= 0.4 ? 'MEDIUM' : 'LOW'),
        score: Math.round(bestScore * 100) + '%'
      });
    } else {
      results.push({
        number: num,
        hasImage: hasImg ? 'YES' : 'NO',
        hasPdf: hasPdf ? 'YES' : 'NO',
        imageUrl: hasImg ? 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/course-images/' + num + '.png' : '',
        pdfUrl: hasPdf ? 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/uploads/pdfs/' + num + '.pdf' : '',
        masterTitle: master.title,
        matchedTitle: '--- Pending Assignment ---',
        packageType: '',
        category: '',
        confidence: 'NONE',
        score: '0%'
      });
    }
  }

  const escapeCsv = (str) => '"' + String(str || '').replace(/"/g, '""') + '"';
  const csvHeaders = ['Number', 'Has_R2_Image', 'Has_R2_PDF', 'Matched_DB_Course_Title', 'Confidence', 'Match_Score', 'Package_Type', 'Category', 'Original_Master_Title', 'R2_Image_URL', 'R2_PDF_URL'];
  const csvRows = [csvHeaders.join(',')];

  for (const r of results) {
    csvRows.push([
      r.number,
      r.hasImage,
      r.hasPdf,
      escapeCsv(r.matchedTitle),
      r.confidence,
      r.score,
      escapeCsv(r.packageType),
      escapeCsv(r.category),
      escapeCsv(r.masterTitle),
      escapeCsv(r.imageUrl),
      escapeCsv(r.pdfUrl)
    ].join(','));
  }

  // Also append Unmatched DB courses section at bottom of CSV
  csvRows.push('');
  csvRows.push('--- DB COURSES NOT YET MATCHED TO A NUMBER ---');
  csvRows.push('DB_Index,Title,Package_Type,Category');
  
  dbCourses.forEach((c, idx) => {
    if (!matchedDbIndexes.has(idx)) {
      csvRows.push([idx, escapeCsv(c.title), escapeCsv(c.type), escapeCsv(c.category)].join(','));
    }
  });

  const outputPath = '../mapping_preview.csv';
  fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf8');
  console.log('Successfully written mapping CSV to:', outputPath);

  const matchedCount = results.filter(r => r.matchedTitle !== '--- Pending Assignment ---').length;
  console.log('Summary: ' + matchedCount + ' items automatically matched out of 96.');
  console.log('Unmatched DB courses:', dbCourses.length - matchedDbIndexes.size);
})();
