import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { config } from './config';
import Course from './models/Course';
import Category from './models/Category';
import { slugify } from './models/shared';

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  Agriculture: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80',
  Commerce: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=900&q=80',
  Digital: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80',
  'F&B': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
  Manufacturing: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=80',
  Services: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
};

const CATEGORY_ICONS: Record<string, string> = {
  Agriculture: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=96&q=80',
  Commerce: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=96&q=80',
  Digital: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=96&q=80',
  'F&B': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=96&q=80',
  Manufacturing: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=96&q=80',
  Services: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=96&q=80',
};

async function uploadDbJson() {
  const jsonPath = path.resolve('d:/Cre8vStudio/vyapari-kit/db.json');
  console.log(`Reading db.json from: ${jsonPath}`);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`db.json not found at ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const items: any[] = JSON.parse(raw);

  console.log(`Loaded ${items.length} items from db.json`);

  const uri = process.env.MONGODB_URI || config.mongodbUri || 'mongodb://localhost:27017/vyaparikit';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected.');

  // 1. Wipe old courses cleanly so there is no duplicate or corrupted state
  console.log('Clearing existing courses in MongoDB...');
  await Course.deleteMany({});

  const usedSlugs = new Set<string>();

  function makeUniqueSlug(base: string): string {
    let clean = slugify(base);
    if (!clean) clean = 'course';
    let candidate = clean;
    let counter = 2;
    while (usedSlugs.has(candidate)) {
      candidate = `${clean}-${counter}`;
      counter++;
    }
    usedSlugs.add(candidate);
    return candidate;
  }

  const coursesToInsert: any[] = [];
  const businessPlansList: any[] = [];

  for (const item of items) {
    if (!item.title || !item.title.trim()) continue;

    // Normalize category
    const rawCat = (item.category || item.categoryName || 'Services').trim();
    let categoryName = rawCat;
    if (categoryName.toUpperCase().includes('F&B') || categoryName.toUpperCase().includes('FOOD')) {
      categoryName = 'F&B';
    } else if (categoryName.toLowerCase().includes('agri')) {
      categoryName = 'Agriculture';
    } else if (categoryName.toLowerCase().includes('commerce')) {
      categoryName = 'Commerce';
    } else if (categoryName.toLowerCase().includes('digital')) {
      categoryName = 'Digital';
    } else if (categoryName.toLowerCase().includes('manuf')) {
      categoryName = 'Manufacturing';
    } else if (categoryName.toLowerCase().includes('service')) {
      categoryName = 'Services';
    }

    // Normalize type
    let packageType = 'business-plans';
    const rawType = (item.type || '').trim().toLowerCase();
    if (rawType === 'business-tools' || rawType.includes('tool')) {
      packageType = 'business-tools';
    } else if (rawType === 'business-in-the-box' || rawType.includes('box')) {
      packageType = 'business-in-the-box';
    } else {
      packageType = 'business-plans';
    }

    const uniqueSlug = makeUniqueSlug(item.slug || item.title);
    const defaultImage = CATEGORY_DEFAULT_IMAGES[categoryName] || CATEGORY_DEFAULT_IMAGES.Services;

    const courseDoc = {
      title: item.title.trim(),
      slug: uniqueSlug,
      packageType,
      categoryName,
      instructorName: item.instructorName || 'Vyapari Kit Team',
      difficulty: item.difficulty && ['Beginner', 'Intermediate', 'Advanced'].includes(item.difficulty)
        ? item.difficulty
        : 'Beginner',
      price: Number(item.price ?? (packageType === 'business-tools' ? 299 : 399)),
      oldPrice: item.oldPrice ? Number(item.oldPrice) : (Number(item.price || 399) * 3),
      rating: Number(item.rating ?? 4.9),
      imageUrl: item.imageUrl?.trim() || defaultImage,
      subtitle: item.subtitle || '',
      editionNote: item.editionNote || 'UPDATED 2026 EDITION',
      language: item.language || 'English',
      isPublished: true,
      description: Array.isArray(item.description) ? item.description : (item.description ? [item.description] : [item.title]),
      includes: Array.isArray(item.includes) ? item.includes : [],
      learningHighlights: Array.isArray(item.learningHighlights) ? item.learningHighlights : [],
      skills: Array.isArray(item.skills) ? item.skills : [],
      requirements: Array.isArray(item.requirements) ? item.requirements : [],
      audience: Array.isArray(item.audience) ? item.audience : [],
      faqs: Array.isArray(item.faqs) ? item.faqs : [],
    };

    coursesToInsert.push(courseDoc);

    if (packageType === 'business-plans') {
      businessPlansList.push(courseDoc);
    }
  }

  // 2. Generate Business in a Box bundle items for each Business Plan!
  console.log(`Generating Business in a Box bundle items for ${businessPlansList.length} Business Plans...`);
  for (const plan of businessPlansList) {
    const boxTitle = `${plan.title} - Business in a Box`;
    const boxSlug = makeUniqueSlug(boxTitle);

    coursesToInsert.push({
      title: boxTitle,
      slug: boxSlug,
      packageType: 'business-in-the-box',
      categoryName: plan.categoryName,
      instructorName: plan.instructorName,
      difficulty: plan.difficulty,
      price: 899,
      oldPrice: 2499,
      rating: 4.9,
      imageUrl: '/images/tiles/business-in-a-box-bundle.png',
      subtitle: `Complete Business Plan + All ${plan.categoryName} Business Tools`,
      editionNote: 'BUNDLE EDITION 2026',
      language: plan.language,
      isPublished: true,
      description: [
        `The complete Business in a Box bundle for ${plan.title}.`,
        `Includes the complete ${plan.title} business plan PLUS instant, full access to all industry-specific tools, playbooks, and calculators in the ${plan.categoryName} category.`,
        ...(plan.description || []),
      ],
      includes: [
        `Complete Business Plan: ${plan.title}`,
        `All ${plan.categoryName} Business Tools & Playbooks Included`,
        'Financial Projections & Costing Spreadsheet',
        'Regulatory & Compliance Roadmap',
        'Lifetime Access & Free Future Updates',
        'Instant Multi-Product Download',
      ],
      learningHighlights: plan.learningHighlights,
      skills: plan.skills,
      requirements: plan.requirements,
      audience: plan.audience,
      faqs: plan.faqs,
    });
  }

  console.log(`Inserting ${coursesToInsert.length} total courses into MongoDB...`);
  await Course.insertMany(coursesToInsert);
  console.log(`Successfully inserted ${coursesToInsert.length} courses!`);

  // 3. Update Categories collection with the 6 unified categories
  const UNIFIED_CATEGORIES = [
    'Agriculture',
    'Commerce',
    'Digital',
    'F&B',
    'Manufacturing',
    'Services',
  ];

  console.log('Upserting unified 6 categories...');
  for (const catName of UNIFIED_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: slugify(catName) },
      {
        $set: {
          name: catName,
          slug: slugify(catName),
          iconUrl: CATEGORY_ICONS[catName] || CATEGORY_ICONS.Services,
          isDeleted: false,
        },
      },
      { upsert: true, new: true }
    );
  }

  // Summary statistics
  const planCount = await Course.countDocuments({ packageType: 'business-plans' });
  const toolCount = await Course.countDocuments({ packageType: 'business-tools' });
  const boxCount = await Course.countDocuments({ packageType: 'business-in-the-box' });
  const totalCount = await Course.countDocuments();

  console.log('\n========================================');
  console.log('UPLOAD COMPLETED SUCCESSFULLY:');
  console.log(`- Business Plans:    ${planCount}`);
  console.log(`- Business Tools:    ${toolCount}`);
  console.log(`- Business in a Box: ${boxCount}`);
  console.log(`- Total Courses:     ${totalCount}`);
  console.log('========================================\n');

  process.exit(0);
}

uploadDbJson().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
