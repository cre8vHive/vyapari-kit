const fs = require('fs');
const pdf = require('pdf-parse');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: './.env' });

(async () => {
  console.log('1. Parsing master catalog PDF...');
  const masterPdfPath = 'C:/Users/aladi/.gemini/antigravity-ide/brain/4c132556-0aa2-47bd-954b-d83deb4d66b3/media__1785418034343.pdf';
  const data = await pdf(fs.readFileSync(masterPdfPath));
  const text = data.text;
  const regex = /(?:^|\n)\s*(\d+)\.\s+([^\n]+)/g;
  const matches = [...text.matchAll(regex)];

  const masterItems = new Map();
  for (let i = 0; i < matches.length; i++) {
    const num = parseInt(matches[i][1]);
    const startPos = matches[i].index + matches[i][0].length;
    const endPos = (i + 1 < matches.length) ? matches[i+1].index : text.length;
    const block = text.slice(startPos, endPos);
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const titleIdx = lines.findIndex(l => l.toLowerCase() === 'title');
    const title = titleIdx !== -1 && lines[titleIdx + 1] ? lines[titleIdx + 1] : matches[i][2].trim();
    const subIdx = lines.findIndex(l => l.toLowerCase() === 'subtitle');
    const subtitle = subIdx !== -1 && lines[subIdx + 1] ? lines[subIdx + 1] : '';
    const catIdx = lines.findIndex(l => l.toLowerCase() === 'category');
    const category = catIdx !== -1 && lines[catIdx + 1] ? lines[catIdx + 1] : '';
    masterItems.set(num, { num, title, subtitle, category });
  }

  console.log('2. Inspecting Cloudflare R2 bucket objects...');
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
  console.log(`Found ${r2Images.size} course images and ${r2Pdfs.size} PDFs in R2.`);

  console.log('3. Loading db.json courses...');
  const dbCourses = JSON.parse(fs.readFileSync('../db.json', 'utf8'));

  // Verified 1-to-1 mappings between number slot and db course
  const explicitMapping = {
    1: { title: 'Internet Goldmine: 100 Scalable Digital Business Ideas for the Modern Age', status: 'DIRECT MATCH' },
    2: { title: 'Recipe for Revenue: 100 Profitable F&B Business Ideas', status: 'DIRECT MATCH' },
    3: { title: 'Buy Low, Sell Smart: 100 High-Margin Commerce & Trading Business Ideas', status: 'DIRECT MATCH' },
    4: { title: 'Make in Profit: 100 Low-Risk, High-Return Manufacturing Business Ideas', status: 'DIRECT MATCH' },
    5: { title: 'Soil to Scale: 100 Profitable Agriculture & Agri-Allied Business Ideas', status: 'DIRECT MATCH' },
    6: { title: 'Faceless YouTube Shorts Empire — Viral Channels with AI', status: 'REFINED EQUIVALENT' },
    7: { title: 'Affiliate Marketing Blueprint', status: 'DIRECT MATCH' },
    8: { title: 'The Small-Scale Manufacturing Success Blueprint', status: 'SEMANTIC MATCH' },
    9: { title: 'Expansion: From One Outlet to Multiple Locations', status: 'DIRECT MATCH' },
    10: { title: 'Skill to Income: 100 High-Demand Service Business Ideas That Actually Sell', status: 'SEMANTIC MATCH' },
    11: { title: 'Pricing, Offers & Subscription Models Guide', status: 'DIRECT MATCH' },
    12: { title: 'Scaling from Small Batch to Mass Production', status: 'EXACT MATCH' },
    13: { title: 'Packaging, Shelf-Life & Food Safety Playbook', status: 'DIRECT MATCH' },
    14: { title: 'Raw Material Sourcing & Vendor Negotiation Guide', status: 'EXACT MATCH' },
    15: { title: 'FSSAI, GST & Compliance Simplified (Food Edition)', status: 'DIRECT MATCH' },
    16: { title: 'Agarbatti Manufacturing: Low-Investment Business Plan & ROI Sheet - Profit Blueprint', status: 'EXACT MATCH' },
    17: { title: 'T-shirt Brand Startup Kit From Idea to ₹1L/month', status: 'REFINED EQUIVALENT' },
    18: { title: 'Biodegradable Packaging Manufacturing Blueprint — Build India\'s Next Eco Brand', status: 'EXACT MATCH' },
    19: { title: 'Cleaning & Hygiene Products Factory - FMCG Profit System', status: 'REFINED EQUIVALENT' },
    20: { title: 'Corrugated Box Factory Plan - Complete Costing & Machines', status: 'EXACT MATCH' },
    21: { title: 'Dehydrated Fruit Snacks Business — ₹5 Lakh/month Healthy Brand', status: 'EXACT MATCH' },
    22: { title: 'Detergent & Cleaning Product Making - Profit Blueprint', status: 'EXACT MATCH' },
    23: { title: 'Fly Ash Brick Manufacturing: Bank Loan Proposal & Cost Analysis - Profit Blueprint', status: 'EXACT MATCH' },
    24: { title: 'Plastic Is Dying Build a Green Packaging Brand Before 2030', status: 'REFINED EQUIVALENT' },
    25: { title: 'Paper Cup & Plate Manufacturing - Machines + ROI + Sales Strategy - Profit Blueprint', status: 'EXACT MATCH' },
    27: { title: 'Stationery Products Manufacturing - School Demand Business - Profit Blueprint', status: 'EXACT MATCH' },
    28: { title: 'Tissue Paper Production Business Plan: Costing, Machinery & Profit Analysis - Profit Blueprint', status: 'EXACT MATCH' },
    29: { title: 'Home Salon & Makeup Artist Business Guide', status: 'EXACT MATCH' },
    30: { title: 'Import–Export Business Plan', status: 'EXACT MATCH' },
    31: { title: 'Laundry & Dry Cleaning Franchise - Repeat Income Model', status: 'EXACT MATCH' },
    32: { title: 'Sneaker Reselling Business: Profit Strategy & Inventory Management Plan', status: 'EXACT MATCH' },
    33: { title: 'Podcast & Content Studio: Commercial Business Plan & Equipment Guide', status: 'EXACT MATCH' },
    34: { title: 'Online Thrift Store Business Plan: Sourcing Strategy & Instagram Growth Guide', status: 'EXACT MATCH' },
    35: { title: 'Product-Market Fit & Winning SKU Selection Guide', status: 'EXACT MATCH' },
    39: { title: 'Customer Experience & Repeat Business Blueprint', status: 'SEMANTIC MATCH' },
    40: { title: 'Online Marketing Funnels & Paid Ads Simplified', status: 'DIRECT MATCH' },
    41: { title: 'Traffic to Transactions', status: 'DIRECT MATCH' },
    43: { title: 'Local Lead Generation & Google Maps Growth Guide', status: 'DIRECT MATCH' },
    46: { title: 'D2C Marketing System: Ads, Influencers & Content', status: 'SEMANTIC MATCH' },
    52: { title: 'Retail Pricing, Discounts & Profit Protection Playbook', status: 'DIRECT MATCH' },
    53: { title: 'Dropshipping E-commerce Blueprint: Zero-Inventory Business Plan', status: 'REFINED EQUIVALENT' },
    54: { title: 'Retail & D2C Brand Launch Playbook (India)', status: 'DIRECT MATCH' },
    55: { title: 'Pricing, Packages & Profit Systems for Services', status: 'DIRECT MATCH' },
    57: { title: 'Inventory, Fulfilment & Cash-Flow Control Guide', status: 'DIRECT MATCH' },
    58: { title: 'Raw Material Sourcing & Vendor Lock-In Strategy', status: 'DIRECT MATCH' },
    59: { title: 'Scaling with Teams, Freelancers & Systems', status: 'DIRECT MATCH' },
    60: { title: 'Production SOPs, Quality Control & Waste Reduction', status: 'DIRECT MATCH' },
    61: { title: 'AI Tools Stack & Automation Playbook', status: 'DIRECT MATCH' },
    62: { title: 'B2B Sales, Dealerships & Distribution Systems', status: 'DIRECT MATCH' },
    63: { title: 'Street Food to Franchise Model: Build a Food Brand That Prints Money', status: 'DIRECT MATCH' },
    66: { title: 'Instant Tiffin Startup Business Plan - ₹0 to Profit in 30 Days', status: 'REFINED EQUIVALENT' },
    68: { title: 'Specialty Coffee Shop & Cafe: Aesthetics, Operations & Revenue Model', status: 'EXACT MATCH' },
    69: { title: 'Healthy Drinks Brand Launch Kit', status: 'EXACT MATCH' },
    70: { title: 'Modern Dairy Farming: Cattle Management & Milk Processing Plan', status: 'EXACT MATCH' },
    71: { title: 'Commercial Hydroponics Farm: High-Tech Agriculture Business Plan', status: 'REFINED EQUIVALENT' },
    74: { title: 'Poultry Farming & Hatchery: Layer/Broiler Business Plan with Costing', status: 'EXACT MATCH' },
    80: { title: 'AI Digital Marketing Agency: Scalable Service Model & Pricing Strategy', status: 'EXACT MATCH' },
    83: { title: 'EV Charging Station Master Plan: Revenue Model & Govt. Policy Guide - Profit Blueprint', status: 'DIRECT MATCH' },
    85: { title: 'Event Management & Wedding Planning: Agency Setup & Vendor Strategy', status: 'EXACT MATCH' },
    86: { title: 'Factory Setup, Machinery & Layout Planning Guide', status: 'EXACT MATCH' },
    88: { title: 'Commercial Gym & Fitness Center Equipment List, Layout & Revenue Plan', status: 'EXACT MATCH' },
    94: { title: 'AI-Based Digital Product Empire', status: 'EXACT MATCH' },
    95: { title: 'Vyapaarkit Marketing Tool', status: 'EXACT MATCH' }
  };

  const matchedCourseTitles = new Set();
  const rows = [];

  for (let num = 1; num <= 96; num++) {
    const master = masterItems.get(num) || { title: `Master Item #${num}`, subtitle: '', category: '' };
    const hasImage = r2Images.has(num) ? 'YES' : 'NO';
    const hasPdf = r2Pdfs.has(num) ? 'YES' : 'NO';
    const imageUrl = r2Images.has(num) ? `https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/course-images/${num}.png` : '';
    const pdfUrl = r2Pdfs.has(num) ? `https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/uploads/pdfs/${num}.pdf` : '';

    const mapping = explicitMapping[num];
    if (mapping) {
      const course = dbCourses.find(c => c.title === mapping.title);
      matchedCourseTitles.add(mapping.title);
      rows.push({
        num,
        hasImage,
        hasPdf,
        matchedTitle: mapping.title,
        status: mapping.status,
        packageType: course ? (course.type || course.packageType || '') : '',
        category: course ? (course.category || course.categoryName || '') : '',
        originalMasterTitle: master.title,
        originalCategory: master.category,
        imageUrl,
        pdfUrl
      });
    } else {
      rows.push({
        num,
        hasImage,
        hasPdf,
        matchedTitle: '--- Pending Review / Unassigned ---',
        status: 'PENDING_REVIEW',
        packageType: '',
        category: '',
        originalMasterTitle: master.title,
        originalCategory: master.category,
        imageUrl,
        pdfUrl
      });
    }
  }

  const escapeCsv = (str) => '"' + String(str || '').replace(/"/g, '""') + '"';

  const csvLines = [];
  csvLines.push([
    'Number',
    'Has_R2_Image',
    'Has_R2_PDF',
    'Matched_DB_Course_Title',
    'Match_Status',
    'Package_Type',
    'DB_Category',
    'Original_Master_Title',
    'Original_Category',
    'R2_Image_URL',
    'R2_PDF_URL'
  ].join(','));

  for (const r of rows) {
    csvLines.push([
      r.num,
      r.hasImage,
      r.hasPdf,
      escapeCsv(r.matchedTitle),
      r.status,
      escapeCsv(r.packageType),
      escapeCsv(r.category),
      escapeCsv(r.originalMasterTitle),
      escapeCsv(r.originalCategory),
      escapeCsv(r.imageUrl),
      escapeCsv(r.pdfUrl)
    ].join(','));
  }

  // Section 2: DB courses not yet linked
  csvLines.push('');
  csvLines.push('========================================================================================');
  csvLines.push('SECTION 2: DB COURSES REQUIRING ASSIGNMENT (Total: ' + (dbCourses.length - matchedCourseTitles.size) + ')');
  csvLines.push('========================================================================================');
  csvLines.push('DB_ID,Package_Type,Category,Course_Title,Suggested_Slot_Or_Action');

  dbCourses.forEach((c, idx) => {
    if (!matchedCourseTitles.has(c.title)) {
      csvLines.push([
        idx + 1,
        escapeCsv(c.type || ''),
        escapeCsv(c.category || ''),
        escapeCsv(c.title),
        'Available to map to any unassigned number slot or needs custom thumbnail'
      ].join(','));
    }
  });

  const outputPath = '../mapping_preview.csv';
  fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf8');
  console.log(`\nMapping successfully generated at: ${outputPath}`);
  console.log(`Total numbered slots mapped: ${rows.filter(r => r.status !== 'PENDING_REVIEW').length} / 96`);
  console.log(`Remaining DB courses in Section 2: ${dbCourses.length - matchedCourseTitles.size}`);
})();
