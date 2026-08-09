import fs from 'fs';
import mongoose from 'mongoose';
import { config } from './config';
import Course from './models/Course';
import CoursePdf from './models/CoursePdf';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const pdfParse = pdf.default || pdf;

// The base URL where you will upload your PDFs in Cloudflare R2
const PDF_BASE_URL = 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/course-pdfs/';

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || config.mongodbUri || 'mongodb://localhost:27017/vyaparikit');
  console.log('Connected.');

  const pdfPath = 'C:/Users/aladi/.gemini/antigravity-ide/brain/4c132556-0aa2-47bd-954b-d83deb4d66b3/media__1785418034343.pdf';
  console.log('Reading original text PDF for mapping...');
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);

  const rawText = data.text;
  
  // Split by course title pattern but keep the number
  const courseBlocks = rawText.split(/\n(\d+)\.\s+/);
  courseBlocks.shift();

  let updatedCount = 0;
  const unmatchedTitles: string[] = [];

  for (let i = 0; i < courseBlocks.length; i += 2) {
    const number = courseBlocks[i];
    const block = courseBlocks[i + 1];

    const lines = block.split('\n').map(l => l.trim()).filter(l => l);

    let currentSection = '';
    let title = '';

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      if (['Title', 'Subtitle', 'Rating', 'Language', 'Category'].includes(line)) {
        currentSection = line;
      } else if (currentSection === 'Title' && !title) {
        title = line;
      }
    }

    if (title) {
      try {
        const course = await Course.findOne({ title: title });
        if (course) {
          const pdfUrl = `${PDF_BASE_URL}${number}.pdf`;
          
          // 1. Create or Update the CoursePdf document
          let coursePdf = await CoursePdf.findOne({ course: course._id });
          if (!coursePdf) {
            coursePdf = new CoursePdf({
              course: course._id,
              storageType: 'external',
              filename: `${number}.pdf`,
              mimeType: 'application/pdf',
              externalUrl: pdfUrl
            });
            await coursePdf.save();
          } else {
            coursePdf.externalUrl = pdfUrl;
            coursePdf.storageType = 'external';
            await coursePdf.save();
          }

          // 2. Link it to the Course
          course.pdfAsset = coursePdf._id;
          await course.save();

          console.log(`Linked PDF ${number}.pdf to course: ${title}`);
          updatedCount++;
        } else {
          // Track titles that are not found in the database
          unmatchedTitles.push(title);
          console.log(`No match found in DB for title: ${title}`);
        }
      } catch (err) {
        console.error(`Failed to update ${title}:`, err);
      }
    }
  }

  if (unmatchedTitles.length > 0) {
    const csvContent = 'Unmatched Titles\n' + unmatchedTitles.map(t => `"${t.replace(/"/g, '""')}"`).join('\n');
    const outputPath = 'unmatched_titles.csv';
    fs.writeFileSync(outputPath, csvContent);
    console.log(`\nWrote ${unmatchedTitles.length} unmatched titles to ${outputPath}`);
  } else {
    console.log('\nAll titles were successfully matched in the database!');
  }

  console.log(`\nSuccessfully mapped ${updatedCount} PDFs to courses.`);
  await mongoose.disconnect();
}

main().catch(console.error);
