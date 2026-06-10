import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

const categories = [
  { id: '1', name: 'Business', slug: 'business', iconUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=96&q=80' },
  { id: '2', name: 'Development', slug: 'development', iconUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=96&q=80' },
  { id: '3', name: 'Language', slug: 'language', iconUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=96&q=80' },
  { id: '4', name: 'Marketing', slug: 'marketing', iconUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=96&q=80' },
  { id: '5', name: 'Finance', slug: 'finance', iconUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=96&q=80' },
  { id: '6', name: 'Design', slug: 'design', iconUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=96&q=80' },
  { id: '7', name: 'Photography', slug: 'photography', iconUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=96&q=80' }
];

const courses = [
  {
    id: '1',
    slug: 'photography-masterclass-guide',
    title: 'Photography Masterclass: A Complete Guide to Photography',
    instructorName: 'Onecontributor',
    categoryName: 'Photography',
    difficulty: 'Beginner',
    price: 18.99,
    oldPrice: 30.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '2',
    slug: 'wordpress-developer-course',
    title: 'Complete WordPress Developer Course 2024',
    instructorName: 'Onecontributor',
    categoryName: 'Development',
    difficulty: 'Beginner',
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '3',
    slug: 'personal-finance-course',
    title: 'The Complete Personal Finance Course',
    instructorName: 'Onecontributor',
    categoryName: 'Finance',
    difficulty: 'Beginner',
    price: 17.99,
    oldPrice: 40.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '4',
    slug: 'digital-marketing-course',
    title: 'The Complete Digital Marketing Course',
    instructorName: 'Onecontributor',
    categoryName: 'Marketing',
    difficulty: 'Beginner',
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.6,
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '5',
    slug: 'business-startup-guide',
    title: 'The Business Startup Guide to Become an Entrepreneur',
    instructorName: 'Onecontributor',
    categoryName: 'Business',
    difficulty: 'Beginner',
    price: 18.99,
    oldPrice: 30.99,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: '6',
    slug: 'german-language-course',
    title: 'Best Way to Learn German Language: Full Beginner',
    instructorName: 'Onecontributor',
    categoryName: 'Language',
    difficulty: 'Beginner',
    price: 18.99,
    oldPrice: 20.99,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80'
  }
];

const homePage = {
  title: 'Upskill - Online Course',
  slug: 'home',
  seo: {
    metaTitle: 'Upskill - Online Courses, Bootcamp & Lessons',
    metaDescription: 'Upskill is a learning platform providing courses in business, tech, language, and marketing.',
    noIndex: false
  },
  sections: [
    {
      type: 'hero',
      order: 1,
      config: {
        headline: 'Faster Way For Your Grow & Upskill',
        subheading: 'Gain access to practical courses taught by expert instructors.',
        backgroundType: 'gradient',
        backgroundValue: 'linear-gradient(135deg, #161829 0%, #1f3d3c 55%, #7a4c28 100%)',
        primaryButton: { text: 'Subscribe', link: '/register' },
        secondaryButton: { text: 'Learn Now', link: '/courses' }
      }
    },
    { type: 'categories', order: 2, config: { sectionTitle: 'All Categories', categories } },
    { type: 'course-grid', order: 3, config: { sectionTitle: 'Popular classes', courses: courses.slice(0, 3) } },
    {
      type: 'testimonials',
      order: 4,
      config: {
        sectionTitle: 'What Our Students Say',
        testimonials: [
          { id: '1', name: 'Sophia Morgan', role: 'Student', reviewText: 'Expert-led courses helped me build practical skills quickly.', rating: 5 },
          { id: '2', name: 'Benjamin Reed', role: 'Student', reviewText: 'The lessons are focused, clear, and easy to apply at work.', rating: 5 },
          { id: '3', name: 'Olivia Carter', role: 'Student', reviewText: 'A smooth learning experience with useful projects and guidance.', rating: 5 }
        ]
      }
    },
    {
      type: 'cta',
      order: 5,
      config: {
        title: 'Launch Your Career Journey through Upskill.',
        buttonText: 'Register Now',
        buttonLink: '/register'
      }
    }
  ]
};

app.get('/api/v1/health', (_req, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'not-connected'
  });
});

app.get('/api/v1/pages/:slug', (req, res) => {
  if (req.params.slug === 'home') {
    res.json(homePage);
    return;
  }

  res.status(404).json({ message: 'Page not found' });
});

app.get('/api/v1/categories', (_req, res) => {
  res.json(categories);
});

app.get('/api/v1/courses', (req, res) => {
  const category = String(req.query.category || '').toLowerCase();
  const search = String(req.query.search || '').toLowerCase();

  const filtered = courses.filter((course) => {
    const matchesCategory = !category || course.categoryName.toLowerCase() === category;
    const matchesSearch = !search || course.title.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  res.json(filtered);
});

async function start() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    } catch (error) {
      console.warn('MongoDB unavailable; continuing with mock API data.');
    }
  }

  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  });
}

void start();
