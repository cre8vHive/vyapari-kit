import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { config } from './config';
import Course from './models/Course';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const pdfParse = pdf.default || pdf;

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI || config.mongodbUri || 'mongodb://localhost:27017/vyaparikit');
  console.log('Connected.');

  const pdfPath = 'C:/Users/aladi/.gemini/antigravity-ide/brain/4c132556-0aa2-47bd-954b-d83deb4d66b3/media__1785418034343.pdf';
  console.log('Reading PDF:', pdfPath);
  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);

  const rawText = data.text;

  // Split by course title pattern (e.g. "1. 100 Digital Business Ideas")
  const courseBlocks = rawText.split(/\n\d+\.\s+/);
  // The first block is garbage before "1. "
  courseBlocks.shift();

  console.log(`Found ${courseBlocks.length} courses to parse.`);

  for (const block of courseBlocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l);

    const courseObj: any = {
      isPublished: true,
      instructorName: 'Vyapari Kit Team', // Default instructor
      imageUrl: '/placeholder-course.jpg' // Default image
    };

    let currentSection = '';
    let currentText: string[] = [];

    const flushSection = () => {
      if (!currentSection) return;
      const text = currentText.join('\n');

      switch (currentSection) {
        case 'Title':
          courseObj.title = text;
          // Set slug from title
          courseObj.slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
          break;
        case 'Subtitle':
          courseObj.subtitle = text;
          break;
        case 'Rating':
          const ratingMatch = text.match(/([\d\.]+)/);
          courseObj.rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.9;
          break;
        case 'Language':
          courseObj.language = text;
          break;
        case 'Category':
          courseObj.categoryName = text;
          break;
        case 'Old Price':
          courseObj.oldPrice = parseInt(text.replace(/[^\d]/g, '')) || 0;
          break;
        case 'Discounted Price':
          courseObj.price = parseInt(text.replace(/[^\d]/g, '')) || 0;
          break;
        case 'Course Includes':
          courseObj.includes = currentText.map(l => l.replace(/^●\s*/, ''));
          break;
        case 'What You\'ll Learn':
          courseObj.learningHighlights = currentText.map(l => l.replace(/^●\s*/, ''));
          break;
        case 'Course Description':
          courseObj.description = currentText; // string array
          break;
        case 'Skills You\'ll Gain':
          courseObj.skills = currentText.map(l => l.replace(/^●\s*/, ''));
          break;
        case 'Requirements':
          courseObj.requirements = currentText.map(l => l.replace(/^●\s*/, ''));
          break;
        case 'Who This Course is For':
          courseObj.audience = currentText.map(l => l.replace(/^●\s*/, ''));
          break;
        case 'FAQs':
          courseObj.faqs = [];
          for (let i = 0; i < currentText.length; i += 2) {
            if (currentText[i] && currentText[i + 1]) {
              courseObj.faqs.push({ question: currentText[i], answer: currentText[i + 1] });
            }
          }
          break;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (['Title', 'Subtitle', 'Rating', 'Language', 'Category', 'Old Price', 'Discounted Price', 'Course Includes', 'What You\'ll Learn', 'Course Description', 'Skills You\'ll Gain', 'Requirements', 'Who This Course is For', 'FAQs'].includes(line)) {
        flushSection();
        currentSection = line;
        currentText = [];
      } else {
        if (currentSection) {
          currentText.push(line);
        }
      }
    }
    flushSection();

    // Insert into DB
    if (courseObj.title) {
      try {
        await Course.updateOne(
          { slug: courseObj.slug },
          { $set: courseObj },
          { upsert: true }
        );
        console.log(`Saved: ${courseObj.title}`);
      } catch (err) {
        console.error(`Failed to save ${courseObj.title}:`, err);
      }
    }
  }

  console.log('Import completed.');
  await mongoose.disconnect();
}

main().catch(console.error);
