import fs from 'fs';
import mongoose from 'mongoose';
import { config } from './config';
import Course from './models/Course';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const pdfParse = pdf.default || pdf;

// Choose where your images are hosted.
// If they are in frontend/public/courses/, use '/courses/'
// If they are in Cloudflare R2, use process.env.R2_PUBLIC_URL + '/courses/'
const IMAGE_BASE_URL = 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/course-images/'; // Change this to your R2 url if you upload them there

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || config.mongodbUri || 'mongodb://localhost:27017/vyaparikit');
  console.log('Connected.');

  const pdfPath = 'C:/Users/aladi/.gemini/antigravity-ide/brain/4c132556-0aa2-47bd-954b-d83deb4d66b3/media__1785418034343.pdf';
  console.log('Reading PDF:', pdfPath);
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);

  const rawText = data.text;

  // Split by course title pattern but keep the number
  const courseBlocks = rawText.split(/\n(\d+)\.\s+/);
  courseBlocks.shift(); // Remove the garbage before the first number

  let updatedCount = 0;

  for (let i = 0; i < courseBlocks.length; i += 2) {
    const number = courseBlocks[i];
    const block = courseBlocks[i + 1];

    const lines = block.split('\n').map(l => l.trim()).filter(l => l);

    let currentSection = '';
    let title = '';

    // Extract just the Title to find the corresponding course in the database
    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];
      if (['Title', 'Subtitle', 'Rating', 'Language', 'Category'].includes(line)) {
        currentSection = line;
      } else if (currentSection === 'Title' && !title) {
        title = line;
      }
    }

    if (title) {
      const imageUrl = `${IMAGE_BASE_URL}${number}.png`;
      try {
        const result = await Course.updateOne(
          { title: title },
          { $set: { imageUrl: imageUrl } }
        );
        if (result.modifiedCount > 0) {
          console.log(`Linked image ${number}.png to course: ${title}`);
          updatedCount++;
        }
      } catch (err) {
        console.error(`Failed to update ${title}:`, err);
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} courses with image URLs.`);
  await mongoose.disconnect();
}

main().catch(console.error);
