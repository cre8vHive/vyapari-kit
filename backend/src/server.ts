import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SESSION_TTL_MS, createToken, generateSessionId, hashPassword, requireActiveSession, requireAuth, verifyPassword } from './auth';
import { categories as fallbackCategories, courses as fallbackCourses, homePage } from './data/demoContent';
import Category from './models/Category';
import Course from './models/Course';
import CoursePdf from './models/CoursePdf';
import Enrollment from './models/Enrollment';
import Page from './models/Page';
import PageTemplate from './models/PageTemplate';
import PdfAccessLog from './models/PdfAccessLog';
import User from './models/User';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);
const clientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());
const adminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '25mb' }));

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

function isConfiguredAdminEmail(email: string) {
  return adminEmails.includes(email.trim().toLowerCase());
}

function clientIp(req: Request) {
  const forwardedFor = req.header('x-forwarded-for');
  return forwardedFor ? forwardedFor.split(',')[0].trim() : req.ip;
}

function publicCourse(course: any) {
  return {
    id: String(course._id || course.id),
    slug: course.slug,
    title: course.title,
    instructorName: course.instructorName,
    categoryName: course.categoryName,
    difficulty: course.difficulty,
    price: course.price,
    oldPrice: course.oldPrice,
    rating: course.rating,
    imageUrl: course.imageUrl,
    isPublished: course.isPublished ?? true,
    hasPdf: Boolean(course.pdfAsset),
  };
}

function adminCourse(course: any, pdf?: any) {
  return {
    ...publicCourse(course),
    pdf: pdf ? {
      id: String(pdf._id),
      filename: pdf.filename,
      storageType: pdf.storageType,
      fileSize: pdf.fileSize,
      updatedAt: pdf.updatedAt,
    } : null,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

function courseInput(body: any) {
  const difficulty = body.difficulty || 'Beginner';
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(difficulty)) {
    throw new Error('Difficulty must be Beginner, Intermediate, or Advanced');
  }

  return {
    title: String(body.title || '').trim(),
    instructorName: String(body.instructorName || '').trim(),
    categoryName: String(body.categoryName || '').trim(),
    difficulty,
    price: Number(body.price || 0),
    oldPrice: body.oldPrice === undefined || body.oldPrice === '' ? undefined : Number(body.oldPrice),
    rating: Number(body.rating || 0),
    imageUrl: String(body.imageUrl || '').trim(),
    isPublished: body.isPublished !== false,
  };
}

function requireAdmin(_req: Request, res: Response, next: () => void) {
  const authUser = res.locals.user;
  if (!authUser || (authUser.role !== 'admin' && !isConfiguredAdminEmail(authUser.email))) {
    res.status(403).json({ message: 'Admin access is required' });
    return;
  }

  next();
}

async function assertCourseAccess(courseId: string, userId: string, role: string) {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return null;
  }

  const course = await Course.findOne({ _id: courseId, isPublished: true }).lean();
  if (!course) {
    return null;
  }

  if (role === 'admin') {
    return course;
  }

  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId,
    status: 'active',
  }).select('_id').lean();

  return enrollment ? course : null;
}

async function logPdfAccess(req: Request, userId: string, courseId: string, event: 'manifest' | 'stream' | 'page-view', pageNumber?: number) {
  await PdfAccessLog.create({
    user: userId,
    course: courseId,
    pageNumber,
    event,
    ipAddress: clientIp(req),
    userAgent: req.header('user-agent') || undefined,
  });
}

function decodePdfBase64(pdfBase64: string) {
  const normalized = pdfBase64.includes(',') ? pdfBase64.split(',').pop() || '' : pdfBase64;
  const buffer = Buffer.from(normalized, 'base64');
  const pdfHeader = buffer.subarray(0, 5).toString('utf8');

  if (pdfHeader !== '%PDF-') {
    throw new Error('Uploaded file must be a valid PDF');
  }

  return buffer;
}

function pdfDataToBuffer(data: unknown) {
  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (data instanceof Uint8Array) {
    return Buffer.from(data);
  }

  if (data && typeof data === 'object' && 'buffer' in data) {
    const buffer = (data as { buffer?: unknown }).buffer;
    if (Buffer.isBuffer(buffer)) {
      return buffer;
    }
    if (buffer instanceof Uint8Array) {
      return Buffer.from(buffer);
    }
  }

  return null;
}

async function upsertCoursePdf(courseId: string, payload: any, actorId: string) {
  const filename = String(payload.filename || 'course-material.pdf').trim();
  const pdfBase64 = typeof payload.pdfBase64 === 'string' ? payload.pdfBase64 : '';
  const externalUrl = typeof payload.pdfUrl === 'string' ? payload.pdfUrl.trim() : '';

  if (!pdfBase64 && !externalUrl) {
    throw new Error('Provide either pdfBase64 or pdfUrl');
  }

  const update: Record<string, any> = {
    course: courseId,
    filename,
    mimeType: 'application/pdf',
    updatedBy: actorId,
  };

  if (pdfBase64) {
    const data = decodePdfBase64(pdfBase64);
    update.storageType = 'database';
    update.data = data;
    update.fileSize = data.length;
    update.sha256 = crypto.createHash('sha256').update(data).digest('hex');
    update.externalUrl = undefined;
  } else {
    const parsed = new URL(externalUrl);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('PDF URL must be an http(s) URL');
    }
    update.storageType = 'external';
    update.externalUrl = externalUrl;
    update.fileSize = undefined;
    update.sha256 = undefined;
    update.data = undefined;
  }

  const pdf = await CoursePdf.findOneAndUpdate(
    { course: courseId },
    {
      $set: update,
      $setOnInsert: { createdBy: actorId },
      $unset: pdfBase64 ? { externalUrl: '' } : { data: '', sha256: '', fileSize: '' },
    },
    { new: true, upsert: true }
  );

  await Course.findByIdAndUpdate(courseId, { pdfAsset: pdf._id, updatedBy: actorId });

  return pdf;
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
    role: isConfiguredAdminEmail(email) ? 'admin' : 'student',
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
  const nextRole = isConfiguredAdminEmail(email) ? 'admin' : user.role;
  await User.findByIdAndUpdate(user._id, {
    role: nextRole,
    activeSessionId: sessionId,
    lastHeartbeat: new Date(),
  });
  user.role = nextRole;

  const safeUser = publicUser(user);
  res.json({
    user: safeUser,
    token: createToken(safeUser, sessionId),
  });
});

app.post('/api/v1/auth/logout-all', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  await User.findByIdAndUpdate(user._id, {
    activeSessionId: null,
    lastHeartbeat: null,
  });

  res.json({ message: 'Logged out from all devices successfully' });
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

  if (isConfiguredAdminEmail(user.email) && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }

  res.json({ user: publicUser(user) });
});

app.get('/api/v1/admin/courses', requireAuth, requireActiveSession, requireAdmin, async (_req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const courses = await Course.find().sort({ createdAt: -1 }).lean();
  const pdfs = await CoursePdf.find({ course: { $in: courses.map((course) => course._id) } })
    .select('course filename storageType fileSize updatedAt')
    .lean();
  const pdfByCourse = new Map(pdfs.map((pdf) => [String(pdf.course), pdf]));

  res.json(courses.map((course) => adminCourse(course, pdfByCourse.get(String(course._id)))));
});

app.post('/api/v1/admin/courses', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const authUser = res.locals.user;
    const input = courseInput(req.body);

    if (!input.title || !input.instructorName || !input.categoryName || !input.imageUrl) {
      res.status(400).json({ message: 'Title, instructor, category, and image URL are required' });
      return;
    }

    const course = await Course.create({
      ...input,
      createdBy: authUser.sub,
      updatedBy: authUser.sub,
    });

    if (req.body.pdf) {
      await upsertCoursePdf(String(course._id), req.body.pdf, authUser.sub);
    }

    const savedCourse = await Course.findById(course._id).lean();
    res.status(201).json({ course: publicCourse(savedCourse || course) });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Unable to create course' });
  }
});

app.put('/api/v1/admin/courses/:courseId', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const authUser = res.locals.user;
    const courseId = String(req.params.courseId);
    const input = courseInput(req.body);

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ message: 'Valid courseId is required' });
      return;
    }

    if (!input.title || !input.instructorName || !input.categoryName || !input.imageUrl) {
      res.status(400).json({ message: 'Title, instructor, category, and image URL are required' });
      return;
    }

    const course = await Course.findByIdAndUpdate(
      courseId,
      {
        $set: {
          ...input,
          updatedBy: authUser.sub,
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    if (req.body.pdf) {
      await upsertCoursePdf(courseId, req.body.pdf, authUser.sub);
    }

    const pdf = await CoursePdf.findOne({ course: courseId }).select('course filename storageType fileSize updatedAt').lean();
    res.json({ course: adminCourse(course, pdf) });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Unable to update course' });
  }
});

app.delete('/api/v1/admin/courses/:courseId', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const authUser = res.locals.user;
  const courseId = String(req.params.courseId);
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    res.status(400).json({ message: 'Valid courseId is required' });
    return;
  }

  const course = await Course.findByIdAndUpdate(courseId, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: authUser.sub,
    updatedBy: authUser.sub,
  }).lean();

  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }

  res.json({ ok: true });
});

app.post('/api/v1/admin/courses/:courseId/pdf', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const authUser = res.locals.user;
    const course = await Course.findById(req.params.courseId).select('_id title').lean();
    if (!course) {
      res.status(404).json({ message: 'Course not found' });
      return;
    }

    const pdf = await upsertCoursePdf(String(course._id), req.body, authUser.sub);
    res.json({
      pdf: {
        id: String(pdf._id),
        filename: pdf.filename,
        storageType: pdf.storageType,
        fileSize: pdf.fileSize,
      },
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Unable to save PDF' });
  }
});

app.get('/api/v1/admin/users', requireAuth, requireActiveSession, requireAdmin, async (_req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json(users.map(publicUser));
});

app.get('/api/v1/admin/pdf-access-logs', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const limit = Math.min(Math.max(Number(req.query.limit || 50), 1), 200);
  const courseId = String(req.query.courseId || '');
  const userId = String(req.query.userId || '');
  const dateFrom = String(req.query.dateFrom || '');
  const dateTo = String(req.query.dateTo || '');
  const query: Record<string, any> = {};

  if (courseId) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      res.status(400).json({ message: 'Valid courseId is required' });
      return;
    }
    query.course = courseId;
  }

  if (userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Valid userId is required' });
      return;
    }
    query.user = userId;
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (Number.isNaN(fromDate.getTime())) {
        res.status(400).json({ message: 'dateFrom must be a valid date' });
        return;
      }
      query.createdAt.$gte = fromDate;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      if (Number.isNaN(toDate.getTime())) {
        res.status(400).json({ message: 'dateTo must be a valid date' });
        return;
      }
      query.createdAt.$lte = toDate;
    }
  }

  const logs = await PdfAccessLog.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email')
    .populate('course', 'title')
    .lean();

  res.json(logs.map((log: any) => ({
    id: String(log._id),
    userId: String(log.user?._id || log.user),
    userName: log.user?.name || 'Unknown user',
    userEmail: log.user?.email || '',
    courseId: String(log.course?._id || log.course),
    courseTitle: log.course?.title || 'Unknown course',
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    event: log.event,
    pageNumber: log.pageNumber,
    createdAt: log.createdAt,
  })));
});

app.get('/api/v1/admin/categories', requireAuth, requireActiveSession, requireAdmin, async (_req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json(categories.map((category) => ({
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    iconUrl: category.iconUrl,
  })));
});

app.post('/api/v1/admin/categories', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const authUser = res.locals.user;
  const name = String(req.body.name || '').trim();
  const iconUrl = String(req.body.iconUrl || '').trim();

  if (!name || !iconUrl) {
    res.status(400).json({ message: 'Category name and icon URL are required' });
    return;
  }

  const category = await Category.create({
    name,
    iconUrl,
    createdBy: authUser.sub,
    updatedBy: authUser.sub,
  });

  res.status(201).json({
    category: {
      id: String(category._id),
      name: category.name,
      slug: category.slug,
      iconUrl: category.iconUrl,
    },
  });
});

app.post('/api/v1/admin/courses/:courseId/enrollments', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const authUser = res.locals.user;
  const courseId = String(req.params.courseId);
  const userId = String(req.body.userId || '');

  if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Valid courseId and userId are required' });
    return;
  }

  const [course, user] = await Promise.all([
    Course.findById(courseId).select('_id').lean(),
    User.findById(userId).select('_id').lean(),
  ]);

  if (!course || !user) {
    res.status(404).json({ message: 'Course or user not found' });
    return;
  }

  const enrollment = await Enrollment.findOneAndUpdate(
    { user: userId, course: courseId },
    {
      $set: {
        status: 'active',
        updatedBy: authUser.sub,
      },
      $setOnInsert: {
        enrolledAt: new Date(),
        createdBy: authUser.sub,
      },
    },
    { new: true, upsert: true }
  );

  res.status(201).json({
    enrollment: {
      id: String(enrollment._id),
      userId,
      courseId,
      status: enrollment.status,
    },
  });
});

app.get('/api/v1/my/courses', requireAuth, requireActiveSession, async (_req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const authUser = res.locals.user;
  if (authUser.role === 'admin') {
    const courses = await Course.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
    res.json(courses.map(publicCourse));
    return;
  }

  const enrollments = await Enrollment.find({ user: authUser.sub, status: 'active' }).select('course').lean();
  const courseIds = enrollments.map((enrollment) => enrollment.course);
  const courses = await Course.find({ _id: { $in: courseIds }, isPublished: true }).sort({ createdAt: -1 }).lean();

  res.json(courses.map(publicCourse));
});

app.get('/api/v1/courses/:courseId/pdf/manifest', requireAuth, requireActiveSession, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const authUser = res.locals.user;
  const courseId = String(req.params.courseId);
  const course = await assertCourseAccess(courseId, authUser.sub, authUser.role);
  if (!course) {
    res.status(403).json({ message: 'You are not authorized to view this course PDF' });
    return;
  }

  const pdf = await CoursePdf.findOne({ course: course._id }).select('filename fileSize storageType').lean();
  if (!pdf) {
    res.status(404).json({ message: 'No PDF is attached to this course' });
    return;
  }

  await logPdfAccess(req, authUser.sub, String(course._id), 'manifest');

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    course: publicCourse(course),
    pdf: {
      filename: pdf.filename,
      fileSize: pdf.fileSize,
      streamUrl: `/api/v1/courses/${course._id}/pdf/file`,
    },
    watermark: {
      name: authUser.name,
      email: authUser.email,
      userId: authUser.sub,
      courseName: course.title,
      issuedAt: new Date().toISOString(),
    },
  });
});

app.get('/api/v1/courses/:courseId/pdf/file', requireAuth, requireActiveSession, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const authUser = res.locals.user;
  const courseId = String(req.params.courseId);
  const course = await assertCourseAccess(courseId, authUser.sub, authUser.role);
  if (!course) {
    res.status(403).json({ message: 'You are not authorized to view this course PDF' });
    return;
  }

  const pdf = await CoursePdf.findOne({ course: course._id }).select('+data +externalUrl filename mimeType fileSize storageType').lean();
  if (!pdf) {
    res.status(404).json({ message: 'No PDF is attached to this course' });
    return;
  }

  await logPdfAccess(req, authUser.sub, String(course._id), 'stream');

  let pdfBuffer: Buffer;
  if (pdf.storageType === 'external') {
    if (!pdf.externalUrl) {
      res.status(404).json({ message: 'PDF URL is missing' });
      return;
    }
    const response = await fetch(pdf.externalUrl);
    if (!response.ok) {
      res.status(502).json({ message: 'Unable to retrieve secure PDF asset' });
      return;
    }
    const arrayBuffer = await response.arrayBuffer();
    pdfBuffer = Buffer.from(arrayBuffer);
  } else if (pdf.data) {
    const storedBuffer = pdfDataToBuffer(pdf.data);
    if (!storedBuffer) {
      res.status(500).json({ message: 'Stored PDF data could not be read' });
      return;
    }
    pdfBuffer = storedBuffer;
  } else {
    res.status(404).json({ message: 'PDF data is missing' });
    return;
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Length', String(pdfBuffer.length));
  res.setHeader('Content-Disposition', `inline; filename="${pdf.filename.replace(/"/g, '')}"`);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(pdfBuffer);
});

app.post('/api/v1/courses/:courseId/pdf/access-log', requireAuth, requireActiveSession, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const authUser = res.locals.user;
  const courseId = String(req.params.courseId);
  const course = await assertCourseAccess(courseId, authUser.sub, authUser.role);
  if (!course) {
    res.status(403).json({ message: 'You are not authorized to view this course PDF' });
    return;
  }

  const pageNumber = Number(req.body.pageNumber || 0);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    res.status(400).json({ message: 'A valid pageNumber is required' });
    return;
  }

  await logPdfAccess(req, authUser.sub, String(course._id), 'page-view', pageNumber);
  res.json({ ok: true });
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
    const query: Record<string, any> = { isPublished: true };
    if (category) query.categoryName = new RegExp(`^${category}$`, 'i');
    if (search) query.title = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const courses = await Course.find(query).sort({ createdAt: -1 }).lean();
    res.json(courses.map(publicCourse));
    return;
  }

  const filtered = fallbackCourses.filter((course) => {
    const matchesCategory = !category || course.categoryName.toLowerCase() === category;
    const matchesSearch = !search || course.title.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  res.json(filtered);
});

app.get('/api/v1/courses/:courseId', async (req, res) => {
  if (isMongoConnected()) {
    const query = mongoose.Types.ObjectId.isValid(req.params.courseId)
      ? { _id: req.params.courseId, isPublished: true }
      : { slug: req.params.courseId, isPublished: true };

    const course = await Course.findOne(query).lean();
    if (course) {
      res.json(publicCourse(course));
      return;
    }
  }

  const fallback = fallbackCourses.find((course) => course.id === req.params.courseId || course.slug === req.params.courseId);
  if (fallback) {
    res.json({ ...fallback, hasPdf: false, isPublished: true });
    return;
  }

  res.status(404).json({ message: 'Course not found' });
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
