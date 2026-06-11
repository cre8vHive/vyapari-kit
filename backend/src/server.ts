import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { SESSION_TTL_MS, createToken, generateSessionId, hashPassword, requireActiveSession, requireAuth, verifyPassword } from './auth';
import { categories as fallbackCategories, courses as fallbackCourses, homePage } from './data/demoContent';
import Category from './models/Category';
import Course from './models/Course';
import Page from './models/Page';
import PageTemplate from './models/PageTemplate';
import User from './models/User';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const clientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json());

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function publicUser(user: { _id: unknown; name: string; email: string; role: string }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function seedDemoContent() {
  if (!isMongoConnected()) return;

  await Category.bulkWrite(
    fallbackCategories.map((category) => {
      const { id: _id, ...categoryDoc } = category;
      return {
        updateOne: {
          filter: { slug: category.slug },
          update: { $set: categoryDoc },
          upsert: true,
        },
      };
    })
  );

  await Course.bulkWrite(
    fallbackCourses.map((course) => {
      const { id: _id, ...courseDoc } = course;
      return {
        updateOne: {
          filter: { slug: course.slug },
          update: { $set: courseDoc },
          upsert: true,
        },
      };
    })
  );

  const template = await PageTemplate.findOneAndUpdate(
    { key: 'landing-page' },
    {
      $set: {
        name: 'Landing Page',
        key: 'landing-page',
        description: 'Default landing page template',
      },
    },
    { new: true, upsert: true }
  );

  await Page.findOneAndUpdate(
    { slug: homePage.slug },
    {
      $set: {
        ...homePage,
        template: template._id,
      },
    },
    { new: true, upsert: true }
  );
}

app.get('/api/v1/health', (_req, res) => {
  res.json({
    ok: true,
    database: isMongoConnected() ? 'connected' : 'not-connected',
  });
});

app.post('/api/v1/auth/register', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (name.length < 2 || !email || password.length < 8) {
    res.status(400).json({ message: 'Name, valid email, and 8+ character password are required' });
    return;
  }

  const existingUser = await User.findOne({ email }).select('_id').lean();
  if (existingUser) {
    res.status(409).json({ message: 'An account with this email already exists' });
    return;
  }

  const sessionId = generateSessionId();
  const user = await User.create({
    name,
    email,
    passwordHash: hashPassword(password),
    role: 'student',
    activeSessionId: sessionId,
    lastHeartbeat: new Date(),
  });

  const safeUser = publicUser(user);
  res.status(201).json({
    user: safeUser,
    token: createToken(safeUser, sessionId),
  });
});

app.post('/api/v1/auth/login', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email }).select('+passwordHash +activeSessionId +lastHeartbeat');

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  // ── Single-session lock: block login if another session is active ──
  if (user.activeSessionId && user.lastHeartbeat) {
    const timeSinceHeartbeat = Date.now() - new Date(user.lastHeartbeat).getTime();
    if (timeSinceHeartbeat < SESSION_TTL_MS) {
      res.status(403).json({
        message: 'This account is already logged in on another device. Please log out from that device first.',
        code: 'SESSION_ACTIVE',
      });
      return;
    }
  }

  const sessionId = generateSessionId();
  await User.findByIdAndUpdate(user._id, {
    activeSessionId: sessionId,
    lastHeartbeat: new Date(),
  });

  const safeUser = publicUser(user);
  res.json({
    user: safeUser,
    token: createToken(safeUser, sessionId),
  });
});

app.post('/api/v1/auth/logout', requireAuth, async (_req, res) => {
  const authUser = res.locals.user;

  if (isMongoConnected()) {
    await User.findByIdAndUpdate(authUser.sub, {
      activeSessionId: null,
      lastHeartbeat: null,
    });
  }

  res.json({ message: 'Logged out successfully' });
});

app.post('/api/v1/auth/heartbeat', requireAuth, requireActiveSession, async (_req, res) => {
  const authUser = res.locals.user;

  await User.findByIdAndUpdate(authUser.sub, {
    lastHeartbeat: new Date(),
  });

  res.json({ ok: true });
});

app.get('/api/v1/auth/me', requireAuth, requireActiveSession, async (_req, res) => {
  const authUser = res.locals.user;

  if (!isMongoConnected()) {
    res.json({
      user: {
        id: authUser.sub,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
      },
    });
    return;
  }

  const user = await User.findById(authUser.sub);
  if (!user) {
    res.status(401).json({ message: 'Account no longer exists' });
    return;
  }

  res.json({ user: publicUser(user) });
});

app.get('/api/v1/pages/:slug', async (req, res) => {
  if (isMongoConnected()) {
    const page = await Page.findOne({ slug: req.params.slug }).lean();
    if (page) {
      res.json(page);
      return;
    }
  }

  if (req.params.slug === 'home') {
    res.json(homePage);
    return;
  }

  res.status(404).json({ message: 'Page not found' });
});

app.get('/api/v1/categories', async (_req, res) => {
  if (isMongoConnected()) {
    const categories = await Category.find().sort({ name: 1 }).lean();
    res.json(categories);
    return;
  }

  res.json(fallbackCategories);
});

app.get('/api/v1/courses', async (req, res) => {
  const category = String(req.query.category || '').toLowerCase();
  const search = String(req.query.search || '').toLowerCase();

  if (isMongoConnected()) {
    const query: Record<string, any> = {};
    if (category) query.categoryName = new RegExp(`^${category}$`, 'i');
    if (search) query.title = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const courses = await Course.find(query).sort({ createdAt: -1 }).lean();
    res.json(courses);
    return;
  }

  const filtered = fallbackCourses.filter((course) => {
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
      await seedDemoContent();
      console.log('Demo content synced to MongoDB');
    } catch (error) {
      console.error('MongoDB Error:', error);
    }
  }

  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  });
}

void start();
