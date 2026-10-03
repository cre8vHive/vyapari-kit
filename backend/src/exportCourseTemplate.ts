import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { config } from './config';

async function exportTemplate() {
  const uri = process.env.MONGODB_URI || config.mongodbUri || 'mongodb://localhost:27017/vyaparikit';
  await mongoose.connect(uri);

  const courses = await mongoose.connection.collection('courses').find({
    isDeleted: { $ne: true }
  }).sort({ title: 1 }).toArray();

  const template = courses.map((c) => ({
    id: String(c._id),
    currentTitle: c.title,
    newTitle: c.title,
    currentCategory: c.categoryName || '',
    type: 'business-plans', // 'business-plans' | 'business-tools' | 'business-in-the-box'
    subcategory: '', // Set to one of your 6 fixed subcategories
  }));

  const outDir = path.join(process.cwd(), 'src', 'data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'courses_mapping_template.json');
  fs.writeFileSync(outPath, JSON.stringify(template, null, 2), 'utf-8');
  console.log(`Successfully exported ${template.length} courses to ${outPath}`);
  process.exit(0);
}

exportTemplate().catch((err) => {
  console.error('Failed to export template:', err);
  process.exit(1);
});
