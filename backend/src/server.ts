import cors from 'cors';
import crypto from 'crypto';
import 'express-async-errors';
import express, { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import Razorpay from 'razorpay';
import { SESSION_TTL_MS, createToken, generateSessionId, hashPassword, requireActiveSession, requireAuth, verifyPassword } from './auth';
import { config, validateConfig } from './config';
import { categories as fallbackCategories, courses as fallbackCourses, homePage } from './data/demoContent';
import Category from './models/Category';
import Course from './models/Course';
import CoursePdf from './models/CoursePdf';
import Enrollment from './models/Enrollment';
import Page from './models/Page';
import PageTemplate from './models/PageTemplate';
import PdfAccessLog from './models/PdfAccessLog';
import SiteSettings from './models/SiteSettings';
import User from './models/User';
import { Complaint } from './models/Complaint';
import { Logger } from './services/logger.service';
import { PasswordService } from './services/password.service';
import { EmailService } from './services/email.service';
import { uploadRoutes } from './routes/upload.routes';
import {
  accessLogger,
  apiNoStore,
  authLimiter,
  clientIp,
  corsOptions,
  generalApiLimiter,
  pdfLimiter,
  permissionsPolicy,
  responseCompression,
  safePdfFilename,
  securityHeaders,
  validateExternalPdfUrl,
} from './security';

validateConfig();

const app = express();
const port = config.port;
const adminEmails = config.adminEmails;
const maxPasswordLength = 256;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxyHops);
app.use(accessLogger);
app.use(securityHeaders());
app.use(permissionsPolicy);
app.use(responseCompression);
app.use(cors(corsOptions));
app.use('/api', apiNoStore);
app.use('/api', generalApiLimiter);
app.use(express.json({ limit: config.jsonBodyLimit }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/logout-all'], authLimiter);
app.use('/api/v1/courses/:courseId/pdf', pdfLimiter);

app.use('/api/v1/upload', uploadRoutes);

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function publicUser(user: any) {
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastHeartbeat: user.lastHeartbeat,
    failedLoginAttempts: user.failedLoginAttempts ?? 0,
    lockedUntil: user.lockedUntil,
    isEmailVerified: user.isEmailVerified ?? false,
    isDeleted: user.isDeleted ?? false,
  };
}

function isConfiguredAdminEmail(email: string) {
  return adminEmails.includes(email.trim().toLowerCase());
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function publicCourse(course: any) {
  const pkgType = course.packageType || 'business-plans';
  const coursePrice = (pkgType === 'business-plans' && (course.price === undefined || course.price === null || course.price === 299))
    ? 399
    : (course.price ?? (pkgType === 'business-tools' ? 299 : 399));

  const rawInstructor = course.instructorName || course.instructor?.name;
  const instructorName = (!rawInstructor || /vyapa+ri\s*kit\s*team/i.test(rawInstructor))
    ? 'VyapaarKit Team'
    : rawInstructor;

  return {
    id: String(course._id || course.id),
    slug: course.slug,
    title: course.title,
    packageType: pkgType,
    instructorName,
    categoryName: course.categoryName,
    difficulty: course.difficulty,
    price: coursePrice,
    oldPrice: course.oldPrice,
    rating: course.rating,
    imageUrl: course.imageUrl,
    isPublished: course.isPublished ?? true,
    isPopular: Boolean(course.isPopular),
    popularOrder: typeof course.popularOrder === 'number' ? course.popularOrder : 0,
    hasPdf: Boolean(course.pdfAsset),
    shortDescription: course.shortDescription,
    subtitle: course.subtitle || '',
    description: course.description,
    thumbnail: course.thumbnail || course.imageUrl,
    bannerImage: course.bannerImage,
    requirements: course.requirements,
    learningOutcomes: course.learningOutcomes,
    keyPoints: course.keyPoints,
    skills: course.skills,
    audience: course.audience,
    includes: course.includes,
    curriculum: course.curriculum,
    faqs: course.faqs,
    reviews: course.reviews,
    editionNote: course.editionNote || '',
    gallery: course.gallery || [],
    boxImageUrl: course.boxImageUrl || null,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
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

  let packageType = body.packageType || body.type || 'business-plans';
  if (packageType === 'business-plan') packageType = 'business-plans';

  return {
    title: String(body.title || '').trim(),
    packageType,
    instructorName: String(body.instructorName || '').trim(),
    categoryName: String(body.categoryName || '').trim(),
    difficulty,
    price: Number(body.price || 0),
    oldPrice: body.oldPrice === undefined || body.oldPrice === '' ? undefined : Number(body.oldPrice),
    rating: Number(body.rating || 0),
    imageUrl: String(body.imageUrl || '').trim(),
    isPublished: body.isPublished !== false,
    subtitle: typeof body.subtitle === 'string' ? body.subtitle.trim() : undefined,
    editionNote: typeof body.editionNote === 'string' ? body.editionNote.trim() : '',
    includes: Array.isArray(body.includes) ? body.includes : undefined,
    learningHighlights: Array.isArray(body.learningHighlights) ? body.learningHighlights : undefined,
    description: Array.isArray(body.description) ? body.description : undefined,
    skills: Array.isArray(body.skills) ? body.skills : undefined,
    requirements: Array.isArray(body.requirements) ? body.requirements : undefined,
    audience: Array.isArray(body.audience) ? body.audience : undefined,
    faqs: Array.isArray(body.faqs) ? body.faqs : undefined,
    isPopular: typeof body.isPopular === 'boolean' ? body.isPopular : undefined,
    popularOrder: typeof body.popularOrder === 'number' ? body.popularOrder : undefined,
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
  const estimatedSize = Math.floor((normalized.length * 3) / 4);
  if (estimatedSize > config.maxPdfUploadBytes) {
    throw new Error(`PDF upload exceeds the ${config.maxPdfUploadBytes} byte limit`);
  }

  const buffer = Buffer.from(normalized, 'base64');
  const pdfHeader = buffer.subarray(0, 5).toString('utf8');

  if (pdfHeader !== '%PDF-') {
    throw new Error('Uploaded file must be a valid PDF');
  }

  if (buffer.length > config.maxPdfUploadBytes) {
    throw new Error(`PDF upload exceeds the ${config.maxPdfUploadBytes} byte limit`);
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
  const filename = safePdfFilename(String(payload.filename || 'course-material.pdf').trim());
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
    const safeExternalUrl = await validateExternalPdfUrl(externalUrl);
    update.storageType = 'external';
    update.externalUrl = safeExternalUrl;
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

async function fulfillBundleEnrollments(userId: any, course: any, actorId?: string) {
  if (course.packageType === 'business-in-the-box') {
    // 1. Find all tools in this subcategory and auto-enroll the user
    const relatedTools = await Course.find({
      packageType: 'business-tools',
      categoryName: course.categoryName,
      isDeleted: { $ne: true },
    }).lean();

    for (const tool of relatedTools) {
      await Enrollment.findOneAndUpdate(
        { user: userId, course: tool._id },
        {
          $set: {
            user: userId,
            course: tool._id,
            status: 'active',
            enrolledAt: new Date(),
            isDeleted: false,
            updatedBy: actorId,
          },
          $setOnInsert: { createdBy: actorId },
        },
        { upsert: true }
      );
    }

    // 2. Also enroll in the corresponding base Business Plan if title matches
    const baseTitle = course.title.replace(/\s*-\s*Business in a Box\s*$/i, '').trim();
    const basePlan = await Course.findOne({
      title: new RegExp(`^${escapeRegex(baseTitle)}$`, 'i'),
      packageType: 'business-plans',
      isDeleted: { $ne: true },
    }).lean();

    if (basePlan) {
      await Enrollment.findOneAndUpdate(
        { user: userId, course: basePlan._id },
        {
          $set: {
            user: userId,
            course: basePlan._id,
            status: 'active',
            enrolledAt: new Date(),
            isDeleted: false,
            updatedBy: actorId,
          },
          $setOnInsert: { createdBy: actorId },
        },
        { upsert: true }
      );
    }
  }
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

  if (name.length < 2 || !emailPattern.test(email)) {
    res.status(400).json({ message: 'Name and a valid email are required' });
    return;
  }

  const passwordErrors = PasswordService.validate(password, { email, name });
  if (passwordErrors.length > 0) {
    res.status(400).json({ message: 'Password does not meet enterprise requirements', errors: passwordErrors });
    return;
  }

  const existingUser = await User.findOne({ email }).select('_id isGuest').lean();
  if (existingUser) {
    if (existingUser.isGuest) {
      // Upgrade guest user to full account
      const sessionId = generateSessionId();
      const verificationToken = crypto.randomBytes(32).toString('hex');

      await User.findByIdAndUpdate(existingUser._id, {
        $set: {
          name,
          passwordHash: hashPassword(password),
          role: isConfiguredAdminEmail(email) ? 'admin' : 'student',
          isGuest: false,
          activeSessionId: sessionId,
          lastHeartbeat: new Date(),
          verificationToken,
          isEmailVerified: false,
          passwordSetupToken: undefined,
        },
      });

      Logger.info('Guest user upgraded to full account', { ...Logger.extractReqContext(req), userId: existingUser._id });

      EmailService.sendVerification({ name, email }, verificationToken).catch(err => Logger.error('Verification email failed', err));

      res.status(201).json({
        message: 'Account activated successfully. Please check your email to verify your account.',
      });
      return;
    }

    Logger.warn('Registration attempt with existing email', Logger.extractReqContext(req));
    res.status(409).json({ message: 'An account with this email already exists' });
    return;
  }

  const sessionId = generateSessionId();
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    name,
    email,
    passwordHash: hashPassword(password),
    role: isConfiguredAdminEmail(email) ? 'admin' : 'student',
    activeSessionId: sessionId,
    lastHeartbeat: new Date(),
    verificationToken,
    isEmailVerified: false,
  });

  Logger.info('User registered', { ...Logger.extractReqContext(req), userId: user._id });

  EmailService.sendWelcome({ name: user.name, email: user.email }).catch(err => Logger.error('Welcome email failed', err));
  EmailService.sendVerification({ name: user.name, email: user.email }, verificationToken).catch(err => Logger.error('Verification email failed', err));

  res.status(201).json({
    message: 'Registration successful. Please check your email to verify your account.'
  });
});

app.post('/api/v1/auth/login', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!emailPattern.test(email) || password.length === 0 || password.length > maxPasswordLength) {
    Logger.warn('Login failed: invalid email or password format', Logger.extractReqContext(req));
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }
  const user = await User.findOne({ email }).select('+passwordHash +activeSessionId +lastHeartbeat +failedLoginAttempts +lockedUntil +isEmailVerified');

  if (!user) {
    Logger.warn('Login failed: user not found', { ...Logger.extractReqContext(req), attemptedEmail: email });
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    Logger.security('Login attempted on locked account', { ...Logger.extractReqContext(req), userId: user._id });
    res.status(403).json({ message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.' });
    return;
  }

  if (user.isEmailVerified === false) {
    Logger.security('Login blocked: unverified email', { ...Logger.extractReqContext(req), userId: user._id });
    res.status(403).json({ message: 'Please verify your email address before logging in.' });
    return;
  }

  if (!verifyPassword(password, user.passwordHash)) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // lock for 15 minutes
      Logger.security('Account locked due to failed login attempts', { ...Logger.extractReqContext(req), userId: user._id });
    }
    await user.save();

    Logger.warn('Login failed: incorrect password', { ...Logger.extractReqContext(req), userId: user._id });
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  // ── Single-session lock: block login if another session is active ──
  if (user.activeSessionId && user.lastHeartbeat) {
    const timeSinceHeartbeat = Date.now() - new Date(user.lastHeartbeat).getTime();
    if (timeSinceHeartbeat < SESSION_TTL_MS) {
      Logger.security('Login blocked: existing active session', { ...Logger.extractReqContext(req), userId: user._id });
      res.status(403).json({
        message: 'This account is already logged in on another device. Please log out from that device first.',
        code: 'SESSION_ACTIVE',
      });
      return;
    }
  }

  const sessionId = generateSessionId();
  const nextRole = isConfiguredAdminEmail(email) ? 'admin' : user.role;

  user.role = nextRole;
  user.activeSessionId = sessionId;
  user.lastHeartbeat = new Date();
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  Logger.info('User logged in', { ...Logger.extractReqContext(req), userId: user._id });

  const safeUser = publicUser(user);
  res.json({
    user: safeUser,
    token: createToken(safeUser, sessionId),
  });
});
app.post('/api/v1/auth/verify-email', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const token = String(req.body.token || '');
  if (!token) {
    res.status(400).json({ message: 'Token is required' });
    return;
  }

  const sessionId = generateSessionId();
  const user = await User.findOneAndUpdate(
    { verificationToken: token },
    {
      $set: {
        isEmailVerified: true,
        activeSessionId: sessionId,
        lastHeartbeat: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null
      },
      $unset: { verificationToken: 1 }
    },
    { new: true }
  );

  if (!user) {
    res.status(400).json({ message: 'Invalid or expired verification token' });
    return;
  }

  Logger.info('User email verified and logged in', { ...Logger.extractReqContext(req), userId: user._id });

  const safeUser = publicUser(user);
  res.json({
    message: 'Email verified successfully',
    user: safeUser,
    token: createToken(safeUser, sessionId)
  });
});

app.post('/api/v1/auth/forgot-password', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  if (!emailPattern.test(email)) {
    res.status(400).json({ message: 'Valid email is required' });
    return;
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.json({ message: 'If that email is registered, a password reset link has been sent.' });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  Logger.info('Password reset requested', { ...Logger.extractReqContext(req), userId: user._id });
  EmailService.sendPasswordReset({ name: user.name, email: user.email }, resetToken).catch(err => Logger.error('Password reset email failed', err));

  res.json({ message: 'If that email is registered, a password reset link has been sent.' });
});

app.post('/api/v1/auth/reset-password', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const token = String(req.body.token || '');
  const password = String(req.body.password || '');

  if (!token || !password) {
    res.status(400).json({ message: 'Token and new password are required' });
    return;
  }

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: new Date() }
  });

  if (!user) {
    res.status(400).json({ message: 'Invalid or expired reset token' });
    return;
  }

  const passwordErrors = PasswordService.validate(password, { email: user.email, name: user.name });
  if (passwordErrors.length > 0) {
    res.status(400).json({ message: 'Password does not meet enterprise requirements', errors: passwordErrors });
    return;
  }

  user.passwordHash = hashPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.activeSessionId = null;
  user.lastHeartbeat = null;
  await user.save();

  Logger.info('Password reset successfully', { ...Logger.extractReqContext(req), userId: user._id });
  res.json({ message: 'Password has been reset successfully' });
});

app.post('/api/v1/auth/set-password', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const token = String(req.body.token || '');
  const password = String(req.body.password || '');

  if (!token || !password) {
    res.status(400).json({ message: 'Token and password are required' });
    return;
  }

  const user = await User.findOne({ passwordSetupToken: token }).select('+passwordHash');
  if (!user) {
    res.status(400).json({ message: 'Invalid or expired setup token' });
    return;
  }

  const passwordErrors = PasswordService.validate(password, { email: user.email, name: user.name });
  if (passwordErrors.length > 0) {
    res.status(400).json({ message: 'Password does not meet requirements', errors: passwordErrors });
    return;
  }

  const sessionId = generateSessionId();

  user.passwordHash = hashPassword(password);
  user.isGuest = false;
  user.isEmailVerified = true;
  user.passwordSetupToken = undefined;
  user.activeSessionId = sessionId;
  user.lastHeartbeat = new Date();
  await user.save();

  const jwt = createToken(
    { id: String(user._id), email: user.email, name: user.name, role: user.role },
    sessionId
  );

  Logger.info('Guest user set password and activated account', { ...Logger.extractReqContext(req), userId: user._id });

  res.json({
    message: 'Password set successfully. You are now logged in.',
    user: publicUser(user),
    token: jwt,
  });
});

app.post('/api/v1/auth/logout-all', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!emailPattern.test(email) || password.length === 0 || password.length > maxPasswordLength) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }
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

let adminCoursesCache: any[] | null = null;
let adminCoursesCacheTime = 0;
const ADMIN_COURSES_CACHE_TTL_MS = 60_000; // 60s fallback TTL

export function invalidateAdminCoursesCache() {
  adminCoursesCache = null;
  adminCoursesCacheTime = 0;
}

app.get('/api/v1/admin/courses', requireAuth, requireActiveSession, requireAdmin, async (_req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const now = Date.now();
  if (adminCoursesCache && now - adminCoursesCacheTime < ADMIN_COURSES_CACHE_TTL_MS) {
    res.json(adminCoursesCache);
    return;
  }

  const [courses, pdfs] = await Promise.all([
    Course.find().sort({ createdAt: -1 }).lean(),
    CoursePdf.find().select('course filename storageType fileSize updatedAt').lean(),
  ]);
  const pdfByCourse = new Map(pdfs.map((pdf) => [String(pdf.course), pdf]));

  const result = courses.map((course) => adminCourse(course, pdfByCourse.get(String(course._id))));
  adminCoursesCache = result;
  adminCoursesCacheTime = now;

  res.json(result);
});

async function getPopularCoursesList() {
  if (!isMongoConnected()) {
    return fallbackCourses.slice(0, 3).map(publicCourse);
  }

  // 1. Check SiteSettings 'popular_courses'
  const setting = await SiteSettings.findOne({ key: 'popular_courses' }).lean();
  let courseIds: string[] = Array.isArray(setting?.value?.courseIds) ? setting.value.courseIds : [];

  // 2. If not in SiteSettings, check Page 'home'
  if (courseIds.length === 0) {
    const homePageDoc = await Page.findOne({ slug: 'home' }).lean();
    const gridSec = homePageDoc?.sections?.find((s: any) => s.type === 'course-grid');
    if (Array.isArray(gridSec?.config?.popularCourseIds) && gridSec.config.popularCourseIds.length > 0) {
      courseIds = gridSec.config.popularCourseIds;
    }
  }

  if (courseIds.length > 0) {
    const validIds = courseIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const courses = await Course.find({ _id: { $in: validIds }, isDeleted: { $ne: true } }).lean();
    const courseMap = new Map(courses.map((c) => [String(c._id), c]));
    const ordered = courseIds
      .map((id) => courseMap.get(String(id)))
      .filter(Boolean)
      .slice(0, 6);

    if (ordered.length > 0) {
      return ordered.map(publicCourse);
    }
  }

  // 3. Fallback to courses marked isPopular
  const popularByFlag = await Course.find({ isPopular: true, isDeleted: { $ne: true } })
    .sort({ popularOrder: 1, createdAt: -1 })
    .limit(6)
    .lean();

  if (popularByFlag.length > 0) {
    return popularByFlag.map(publicCourse);
  }

  // 4. Default fallback: first 3 published courses
  const defaultCourses = await Course.find({ isPublished: true, isDeleted: { $ne: true } })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

  return defaultCourses.map(publicCourse);
}

app.get('/api/v1/admin/popular-courses', requireAuth, requireActiveSession, requireAdmin, async (_req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  let courseIds: string[] = [];
  const setting = await SiteSettings.findOne({ key: 'popular_courses' }).lean();
  if (Array.isArray(setting?.value?.courseIds)) {
    courseIds = setting.value.courseIds;
  } else {
    const homePageDoc = await Page.findOne({ slug: 'home' }).lean();
    const gridSec = homePageDoc?.sections?.find((s: any) => s.type === 'course-grid');
    if (Array.isArray(gridSec?.config?.popularCourseIds)) {
      courseIds = gridSec.config.popularCourseIds;
    }
  }

  if (courseIds.length === 0) {
    const flagged = await Course.find({ isPopular: true, isDeleted: { $ne: true } })
      .sort({ popularOrder: 1 })
      .limit(6)
      .lean();
    courseIds = flagged.map((c) => String(c._id));
  }

  const courses = await getPopularCoursesList();
  res.json({
    courseIds,
    courses,
  });
});

app.put('/api/v1/admin/popular-courses', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const { courseIds } = req.body;
  if (!Array.isArray(courseIds)) {
    res.status(400).json({ message: 'courseIds must be an array' });
    return;
  }

  if (courseIds.length > 6) {
    res.status(400).json({ message: 'Maximum 6 courses allowed for Popular Business Solutions' });
    return;
  }

  const validIds = courseIds
    .map((id: any) => String(id).trim())
    .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
    .slice(0, 6);

  // 1. Reset isPopular for all courses
  await Course.updateMany({}, { $set: { isPopular: false, popularOrder: 0 } });

  // 2. Set isPopular and popularOrder for selected courses
  for (let i = 0; i < validIds.length; i++) {
    await Course.findByIdAndUpdate(validIds[i], {
      $set: { isPopular: true, popularOrder: i },
    });
  }

  // 3. Save to SiteSettings
  await SiteSettings.findOneAndUpdate(
    { key: 'popular_courses' },
    { $set: { value: { courseIds: validIds } } },
    { upsert: true, new: true }
  );

  // 4. Update Page 'home' course-grid section
  const matchedCourses = await Course.find({ _id: { $in: validIds } }).lean();
  const matchedMap = new Map(matchedCourses.map((c) => [String(c._id), c]));
  const orderedDocs = validIds.map((id) => matchedMap.get(id)).filter(Boolean);
  const mappedPublic = orderedDocs.map(publicCourse);

  const homePageDoc = await Page.findOne({ slug: 'home' });
  if (homePageDoc) {
    let gridSection = homePageDoc.sections.find((s: any) => s.type === 'course-grid');
    if (gridSection) {
      gridSection.config = {
        ...gridSection.config,
        sectionTitle: 'Popular Business Solutions',
        popularCourseIds: validIds,
        courses: mappedPublic,
      };
      homePageDoc.markModified('sections');
      await homePageDoc.save();
    }
  }

  invalidateAdminCoursesCache();
  res.json({
    ok: true,
    message: `Updated popular business solutions (${validIds.length} courses)`,
    courseIds: validIds,
    courses: mappedPublic,
  });
});

app.get('/api/v1/popular-courses', async (_req, res) => {
  const courses = await getPopularCoursesList();
  res.json(courses);
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
    invalidateAdminCoursesCache();
    res.status(201).json({ course: publicCourse(savedCourse || course) });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Unable to create course' });
  }
});

app.post('/api/v1/admin/courses/bulk', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const authUser = res.locals.user;
    const { type, category, defaultPrice, defaultOldPrice, defaultInstructor, defaultDifficulty, isPublished, courses: courseList } = req.body;

    if (!Array.isArray(courseList) || courseList.length === 0) {
      res.status(400).json({ message: 'Courses array is required and must not be empty' });
      return;
    }

    let targetCategoryName = 'Business Playbook';
    if (type === 'business-plans') {
      targetCategoryName = 'Business Plan';
    } else if (type === 'business-in-the-box') {
      targetCategoryName = 'Business-in-a-Box';
    } else if (type === 'business-tools') {
      targetCategoryName = 'Business Playbook';
    } else if (category) {
      targetCategoryName = category;
    }

    const createdDocs = [];

    for (const item of courseList) {
      if (!item.title || !item.title.trim()) continue;

      const slugBase = item.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const uniqueSlug = `${slugBase}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      const courseDoc = {
        slug: uniqueSlug,
        title: item.title.trim(),
        instructorName: item.instructorName || defaultInstructor || 'VyapaarKit Team',
        categoryName: item.categoryName || targetCategoryName,
        difficulty: item.difficulty || defaultDifficulty || 'Beginner',
        price: item.price !== undefined && item.price !== '' ? Number(item.price) : Number(defaultPrice || 0),
        oldPrice: item.oldPrice !== undefined && item.oldPrice !== '' ? Number(item.oldPrice) : (defaultOldPrice !== undefined && defaultOldPrice !== '' ? Number(defaultOldPrice) : undefined),
        rating: item.rating ? Number(item.rating) : 4.9,
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
        isPublished: item.isPublished !== undefined ? Boolean(item.isPublished) : (isPublished !== undefined ? Boolean(isPublished) : true),
        subtitle: item.subtitle || '',
        includes: Array.isArray(item.includes) ? item.includes : [],
        learningHighlights: Array.isArray(item.learningHighlights) ? item.learningHighlights : [],
        description: Array.isArray(item.description) ? item.description : (item.description ? [item.description] : [item.title]),
        skills: Array.isArray(item.skills) ? item.skills : [],
        requirements: Array.isArray(item.requirements) ? item.requirements : [],
        audience: Array.isArray(item.audience) ? item.audience : [],
        faqs: Array.isArray(item.faqs) ? item.faqs : [],
        createdBy: authUser.sub,
        updatedBy: authUser.sub,
      };

      const created = await Course.create(courseDoc);
      if (item.pdfUrl) {
        await upsertCoursePdf(String(created._id), { assetUrl: item.pdfUrl }, authUser.sub);
      }
      createdDocs.push(created);
    }

    invalidateAdminCoursesCache();
    res.status(201).json({
      message: `Successfully uploaded ${createdDocs.length} courses for type "${type || 'custom'}"`,
      createdCount: createdDocs.length,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Unable to bulk upload courses' });
  }
});

app.put('/api/v1/admin/courses/bulk-price', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const { price, oldPrice, type, category } = req.body;

    if (price === undefined || price === null || price === '') {
      res.status(400).json({ message: 'Price is required' });
      return;
    }

    const numPrice = Number(price);

    const updateData: any = { $set: { price: numPrice } };
    if (oldPrice !== undefined && oldPrice !== '') {
      updateData.$set.oldPrice = Number(oldPrice);
    } else {
      updateData.$unset = { oldPrice: "" };
    }

    const filter: any = { isDeleted: false };
    if (type) {
      const cleanType = (type === 'business-plan' ? 'business-plans' : type).trim().toLowerCase();
      if (['business-plans', 'business-tools', 'business-in-the-box'].includes(cleanType)) {
        filter.packageType = cleanType;
      }
    }
    if (category) {
      filter.categoryName = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    const result = await Course.updateMany(filter, updateData);
    invalidateAdminCoursesCache();
    res.status(200).json({ message: 'Bulk price update successful', modifiedCount: result.modifiedCount });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Unable to update bulk prices' });
  }
});

app.put('/api/v1/admin/courses/bulk-update', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const authUser = res.locals.user;
    const { courseIds, updates } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      res.status(400).json({ message: 'courseIds array is required and must not be empty' });
      return;
    }

    const validIds = courseIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      res.status(400).json({ message: 'No valid course IDs provided' });
      return;
    }

    const filter = { _id: { $in: validIds }, isDeleted: false };
    const updateOps: any = { $set: { updatedBy: authUser.sub } };

    if (updates) {
      if (typeof updates.title === 'string' && updates.title.trim()) {
        updateOps.$set.title = updates.title.trim();
      }

      if (typeof updates.price === 'number' || (typeof updates.price === 'string' && updates.price.trim() !== '')) {
        const numPrice = Number(updates.price);
        if (!isNaN(numPrice) && numPrice >= 0) {
          updateOps.$set.price = numPrice;
        }
      }

      if (updates.oldPrice !== undefined) {
        if (updates.oldPrice === null || updates.oldPrice === '') {
          updateOps.$unset = { ...updateOps.$unset, oldPrice: "" };
        } else {
          const numOldPrice = Number(updates.oldPrice);
          if (!isNaN(numOldPrice) && numOldPrice >= 0) {
            updateOps.$set.oldPrice = numOldPrice;
          }
        }
      }

      if (updates.packageType && typeof updates.packageType === 'string') {
        const cleanType = (updates.packageType === 'business-plan' ? 'business-plans' : updates.packageType).trim().toLowerCase();
        if (['business-plans', 'business-tools', 'business-in-the-box'].includes(cleanType)) {
          updateOps.$set.packageType = cleanType;
        }
      }

      if (updates.categoryName && typeof updates.categoryName === 'string' && updates.categoryName.trim()) {
        updateOps.$set.categoryName = updates.categoryName.trim();
      }

      if (typeof updates.isPublished === 'boolean') {
        updateOps.$set.isPublished = updates.isPublished;
      }

      if (updates.instructorName && typeof updates.instructorName === 'string' && updates.instructorName.trim()) {
        updateOps.$set.instructorName = updates.instructorName.trim();
      }

      if (updates.difficulty && typeof updates.difficulty === 'string' && updates.difficulty.trim()) {
        updateOps.$set.difficulty = updates.difficulty.trim();
      }

      if (typeof updates.rating === 'number' || (typeof updates.rating === 'string' && updates.rating.trim() !== '')) {
        const numRating = Number(updates.rating);
        if (!isNaN(numRating) && numRating >= 0 && numRating <= 5) {
          updateOps.$set.rating = numRating;
        }
      }

      if (typeof updates.subtitle === 'string') {
        updateOps.$set.subtitle = updates.subtitle.trim();
      }

      if (typeof updates.editionNote === 'string') {
        updateOps.$set.editionNote = updates.editionNote.trim();
      }

      if (typeof updates.imageUrl === 'string' && updates.imageUrl.trim()) {
        updateOps.$set.imageUrl = updates.imageUrl.trim();
      }

      if (typeof updates.thumbnail === 'string') {
        updateOps.$set.thumbnail = updates.thumbnail.trim();
      }

      if (typeof updates.bannerImage === 'string') {
        updateOps.$set.bannerImage = updates.bannerImage.trim();
      }

      if (typeof updates.boxImageUrl === 'string') {
        updateOps.$set.boxImageUrl = updates.boxImageUrl.trim();
      }

      if (Array.isArray(updates.includes)) {
        updateOps.$set.includes = updates.includes.map((s: any) => String(s).trim()).filter(Boolean);
      }

      if (Array.isArray(updates.learningHighlights)) {
        updateOps.$set.learningHighlights = updates.learningHighlights.map((s: any) => String(s).trim()).filter(Boolean);
      }

      if (Array.isArray(updates.skills)) {
        updateOps.$set.skills = updates.skills.map((s: any) => String(s).trim()).filter(Boolean);
      }

      if (Array.isArray(updates.requirements)) {
        updateOps.$set.requirements = updates.requirements.map((s: any) => String(s).trim()).filter(Boolean);
      }

      if (Array.isArray(updates.audience)) {
        updateOps.$set.audience = updates.audience.map((s: any) => String(s).trim()).filter(Boolean);
      }

      if (Array.isArray(updates.description)) {
        updateOps.$set.description = updates.description.map((s: any) => String(s).trim()).filter(Boolean);
      } else if (typeof updates.description === 'string' && updates.description.trim()) {
        updateOps.$set.description = updates.description.split('\n\n').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    let modifiedCount = 0;
    if (Object.keys(updateOps.$set).length > 1 || updateOps.$unset) {
      const resUpdate = await Course.updateMany(filter, updateOps);
      modifiedCount = resUpdate.modifiedCount;
    }

    if (updates?.syncThumbnailFromGallery) {
      const coursesWithGallery = await Course.find({
        _id: { $in: validIds },
        isDeleted: false,
        'gallery.0.url': { $exists: true }
      });

      for (const course of coursesWithGallery) {
        if (course.gallery && course.gallery.length > 0 && course.gallery[0].url) {
          const bannerUrl = course.gallery[0].url;
          course.imageUrl = bannerUrl;
          course.thumbnail = bannerUrl;
          course.bannerImage = bannerUrl;
          course.updatedBy = authUser.sub;
          await course.save();
          modifiedCount++;
        }
      }
    }

    invalidateAdminCoursesCache();
    res.status(200).json({
      message: 'Bulk courses update successful',
      modifiedCount,
      matchedCount: validIds.length
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Unable to bulk update courses' });
  }
});

app.post('/api/v1/admin/courses/bulk-delete', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const authUser = res.locals.user;
    const { courseIds } = req.body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      res.status(400).json({ message: 'courseIds array is required and must not be empty' });
      return;
    }

    const validIds = courseIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      res.status(400).json({ message: 'No valid course IDs provided' });
      return;
    }

    const result = await Course.updateMany(
      { _id: { $in: validIds }, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: authUser.sub,
          updatedBy: authUser.sub,
        }
      }
    );

    invalidateAdminCoursesCache();
    res.status(200).json({
      message: 'Bulk delete successful',
      deletedCount: result.modifiedCount
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Unable to bulk delete courses' });
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
    invalidateAdminCoursesCache();
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

  invalidateAdminCoursesCache();
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
    invalidateAdminCoursesCache();
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

  const users = await User.find({ isDeleted: { $in: [true, false, null] } }).sort({ createdAt: -1 }).lean();
  res.json(users.map(publicUser));
});

app.put('/api/v1/admin/users/:userId', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const userId = String(req.params.userId || '');
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Valid userId is required' });
    return;
  }

  const user = await User.findOne({ _id: userId, isDeleted: { $in: [true, false, null] } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const { name, role } = req.body;
  if (name && typeof name === 'string' && name.trim().length >= 2) {
    user.name = name.trim();
  }

  if (role) {
    if (!['student', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role. Must be student or admin.' });
      return;
    }
    user.role = role;
  }

  await user.save();
  Logger.info('Admin updated user', { ...Logger.extractReqContext(req), targetUserId: userId, updatedRole: role });

  res.json({ user: publicUser(user) });
});

app.post('/api/v1/admin/users/:userId/block', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const userId = String(req.params.userId || '');
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Valid userId is required' });
    return;
  }

  const user = await User.findOne({ _id: userId, isDeleted: { $in: [true, false, null] } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // Lock user for 100 years and invalidate active session
  user.lockedUntil = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
  user.activeSessionId = null;
  await user.save();

  Logger.info('Admin blocked user', { ...Logger.extractReqContext(req), targetUserId: userId });
  res.json({ user: publicUser(user) });
});

app.post('/api/v1/admin/users/:userId/unblock', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const userId = String(req.params.userId || '');
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Valid userId is required' });
    return;
  }

  const user = await User.findOne({ _id: userId, isDeleted: { $in: [true, false, null] } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  user.lockedUntil = null;
  user.failedLoginAttempts = 0;
  await user.save();

  Logger.info('Admin unblocked user', { ...Logger.extractReqContext(req), targetUserId: userId });
  res.json({ user: publicUser(user) });
});

app.delete('/api/v1/admin/users/:userId', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const userId = String(req.params.userId || '');
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Valid userId is required' });
    return;
  }

  const user = await User.findOne({ _id: userId, isDeleted: { $in: [true, false, null] } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  user.isDeleted = true;
  user.deletedAt = new Date();
  user.activeSessionId = null;
  await user.save();

  Logger.info('Admin soft-deleted user', { ...Logger.extractReqContext(req), targetUserId: userId });
  res.json({ user: publicUser(user) });
});

app.post('/api/v1/admin/users/:userId/trigger-reset', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const userId = String(req.params.userId || '');
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Valid userId is required' });
    return;
  }

  const user = await User.findOne({ _id: userId, isDeleted: { $in: [true, false, null] } });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  Logger.info('Admin triggered password reset', { ...Logger.extractReqContext(req), targetUserId: userId });
  EmailService.sendPasswordReset({ name: user.name, email: user.email }, resetToken).catch(err => Logger.error('Password reset email failed', err));

  res.json({ message: `Password reset triggered. An email has been dispatched to ${user.email}.` });
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
    Course.findById(courseId).select('_id title').lean(),
    User.findById(userId).select('_id name email').lean(),
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

  const fullCourse = await Course.findById(courseId).lean();
  if (fullCourse) {
    await fulfillBundleEnrollments(userId, fullCourse, authUser.sub);
  }

  try {
    await EmailService.sendCoursePurchase({ name: user.name, email: user.email }, course.title);
  } catch (err) {
    Logger.error('Failed to send course enrollment email', err);
  }

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
  const enrollments = await Enrollment.find({ user: authUser.sub, status: 'active' }).select('course').lean();
  const courseIds = enrollments.map((enrollment) => enrollment.course);
  const courses = await Course.find({
    $or: [
      { _id: { $in: courseIds } },
      { instructorName: authUser.name }
    ],
    isPublished: true
  }).sort({ createdAt: -1 }).lean();

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

  if (pdf.storageType === 'external') {
    if (!pdf.externalUrl) {
      res.status(404).json({ message: 'PDF URL is missing' });
      return;
    }
    const safeExternalUrl = await validateExternalPdfUrl(pdf.externalUrl);
    let response = await fetch(safeExternalUrl, {
      redirect: 'error',
      signal: AbortSignal.timeout(config.externalPdfFetchTimeoutMs),
    });
    if (!response.ok || !response.body) {
      Logger.warn(`PDF not found at ${safeExternalUrl}, trying default fallback PDF`);
      const fallbackUrl = 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/uploads/pdfs/1.pdf';
      try {
        const fallbackResponse = await fetch(fallbackUrl, {
          signal: AbortSignal.timeout(config.externalPdfFetchTimeoutMs),
        });
        if (fallbackResponse.ok && fallbackResponse.body) {
          response = fallbackResponse;
        }
      } catch {
        // ignore
      }
    }
    if (!response.ok || !response.body) {
      res.status(502).json({ message: 'Unable to retrieve secure PDF asset' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Content-Disposition', `inline; filename="${safePdfFilename(pdf.filename)}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Stream the web stream to Express response
    const readable = Readable.fromWeb(response.body as any);
    readable.on('error', (err) => {
      console.warn('PDF stream interrupted:', err.message);
      if (!res.writableEnded) res.end();
    });
    res.on('close', () => {
      readable.destroy();
    });
    readable.pipe(res);
    return;

  } else if (pdf.data) {
    const storedBuffer = pdfDataToBuffer(pdf.data);
    if (!storedBuffer) {
      res.status(500).json({ message: 'Stored PDF data could not be read' });
      return;
    }
    if (storedBuffer.length > config.maxPdfUploadBytes || storedBuffer.subarray(0, 5).toString('utf8') !== '%PDF-') {
      res.status(502).json({ message: 'Secure PDF asset failed validation' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(storedBuffer.length));
    res.setHeader('Content-Disposition', `inline; filename="${safePdfFilename(pdf.filename)}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(storedBuffer);
  } else {
    res.status(404).json({ message: 'PDF data is missing' });
  }
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

app.post('/api/v1/complaints', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;
    if (!firstName || !lastName || !email || !phone || !subject || !message) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }

    await Complaint.create({ firstName, lastName, email, phone, subject, message });
    res.status(201).json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to submit complaint.' });
  }
});

app.get('/api/v1/admin/complaints', requireAuth, requireActiveSession, requireAdmin, async (_req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 }).lean();
    res.json(complaints.map((c: any) => ({
      id: String(c._id),
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone,
      subject: c.subject,
      message: c.message,
      isResolved: c.isResolved,
      createdAt: c.createdAt,
    })));
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to fetch complaints.' });
  }
});

app.put('/api/v1/admin/complaints/:id/resolve', requireAuth, requireActiveSession, requireAdmin, async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      res.status(404).json({ message: 'Complaint not found.' });
      return;
    }

    complaint.isResolved = !complaint.isResolved;
    await complaint.save();

    res.json({ ok: true, isResolved: complaint.isResolved });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Failed to resolve complaint.' });
  }
});

app.get('/api/v1/pages/:slug', async (req, res) => {
  if (isMongoConnected()) {
    const page = await Page.findOne({ slug: req.params.slug }).lean();
    if (page) {
      if (req.params.slug === 'home' && Array.isArray(page.sections)) {
        const popularList = await getPopularCoursesList();
        page.sections = page.sections.map((section: any) => {
          if (section.type === 'course-grid') {
            return {
              ...section,
              config: {
                ...section.config,
                sectionTitle: 'Popular Business Solutions',
                courses: popularList,
              },
            };
          }
          return section;
        });
      }
      res.json(page);
      return;
    }
  }

  if (req.params.slug === 'home') {
    const popularList = await getPopularCoursesList();
    const fallbackHome = {
      ...homePage,
      sections: homePage.sections.map((section: any) => {
        if (section.type === 'course-grid') {
          return {
            ...section,
            config: {
              ...section.config,
              sectionTitle: 'Popular Business Solutions',
              courses: popularList,
            },
          };
        }
        return section;
      }),
    };
    res.json(fallbackHome);
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

function normalizeCategoryQuery(value: string | undefined | null) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DOMAIN_KEYWORD_MAP: Record<string, string[]> = {
  // General & Business in the Box categories
  'food-and-beverage': ['food', 'beverage', 'cafe', 'cloud kitchen', 'kitchen', 'bakery', 'juice', 'dairy', 'restaurant', 'fssai'],
  'agriculture-and-livestock': ['agriculture', 'agri', 'farming', 'farm', 'poultry', 'dairy', 'goat', 'fish', 'mushroom', 'organic', 'nursery', 'plant', 'livestock'],
  'services-and-events': ['service', 'services', 'event', 'wedding', 'planning', 'management'],
  'health-wellness-and-beauty': ['beauty', 'salon', 'fitness', 'health', 'wellness'],
  'technology-and-ai': ['technology', 'tech', 'ai', 'saas', 'mobile app', 'software', 'digital', 'automation'],
  'master-toolkit': ['business-in-a-box', 'toolkit', 'box'],

  // Business Tools categories
  'strategy-and-launch': ['validation', 'idea', 'startup', 'launch', 'checklist'],
  'marketing-and-sales': ['customer acquisition', 'digital marketing', 'growth', 'sales funnel', 'influencer'],
  'e-commerce-and-digital-commerce': ['d2c', 'e-commerce', 'ecommerce', 'marketplace'],
  'finance-and-profitability': ['pricing', 'profit', 'finance'],
  'supply-chain-and-operations': ['inventory', 'vendor', 'supply chain'],
  'operations-sop-and-automation': ['sop', 'automation', 'operations'],
  'hr-and-team-management': ['hiring', 'employee', 'hr', 'team'],
  'franchise-and-scaling': ['franchise', 'scaling', 'expansion'],

  // Business Plans categories
  'manufacturing-fmcg-and-industrial': ['manufacturing', 'factory', 'fmcg', 'industrial', 'agarbatti', 'biopackaging', 'cleanfmcg', 'corrugation', 'dehydration', 'detergents', 'flyash', 'greenpack', 'paperware', 'stationery', 'tissue', 'mass production', 'raw material'],
  'food-agriculture-and-compliance': ['food', 'agriculture', 'fssai', 'compliance', 'packaging'],
  'digital-e-commerce-and-media': ['digital', 'e-commerce', 'commerce', 'shorts', 'affiliate', 'import export', 'sku'],
  'retail-and-personal-services': ['home salon', 'laundry', 'sneaker', 'studio', 'thrift', 'retail'],
  'strategy-and-growth-playbooks': ['systems', 'profit framework', 'expansion', 'multi-location', 'selection', 'smart pricing'],
};

function normalizeUnifiedCategory(input?: string): string {
  if (!input) return '';
  const clean = input.trim().toLowerCase().replace(/[^a-z0-9&]+/g, '-').replace(/^-+|-+$/g, '');
  if (!clean || clean === 'all') return '';
  if (clean.includes('agri')) return 'Agriculture';
  if (clean.includes('commerce') || clean.includes('retail')) return 'Commerce';
  if (clean.includes('digital') || clean.includes('tech')) return 'Digital';
  if (clean.includes('f-and-b') || clean.includes('f&b') || clean.includes('f-b') || clean.includes('food')) return 'F&B';
  if (clean.includes('manuf') || clean.includes('industrial')) return 'Manufacturing';
  if (clean.includes('service')) return 'Services';
  return input.trim();
}

app.get('/api/v1/courses', async (req, res) => {
  let type = String(req.query.type || '').trim().toLowerCase();
  if (type === 'business-plan') type = 'business-plans';
  if (type === 'business-in-a-box') type = 'business-in-the-box';

  const rawCategory = String(req.query.category || '').trim();
  const targetCategory = normalizeUnifiedCategory(rawCategory);
  const search = String(req.query.search || '').trim().toLowerCase().slice(0, 120);

  console.log(`[GET /api/v1/courses] Incoming request - type: "${type}", category: "${rawCategory}" (normalized: "${targetCategory}"), search: "${search}"`);

  if (isMongoConnected()) {
    const andConditions: Record<string, any>[] = [{ isPublished: true, isDeleted: { $ne: true } }];

    // 1. Explicit Type Filter
    const isBoxFilter = type === 'business-in-the-box';
    if (isBoxFilter) {
      // Every business plan serves as the base plan for a Business in a Box bundle
      andConditions.push({ packageType: 'business-plans' });
    } else if (type && ['business-plans', 'business-tools'].includes(type)) {
      andConditions.push({ packageType: type });
    }

    // 2. Explicit Subcategory Filter
    if (targetCategory) {
      andConditions.push({ categoryName: targetCategory });
    }

    // 3. Search Filter
    if (search) {
      andConditions.push({ title: new RegExp(escapeRegex(search), 'i') });
    }

    const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];
    const courses = await Course.find(query).sort({ createdAt: -1 }).lean();
    console.log(`[GET /api/v1/courses] Returning ${courses.length} courses matching type "${type}" & category "${targetCategory}"`);

    const mapped = courses.map((c) => {
      const pub = publicCourse(c);
      if (isBoxFilter) {
        return {
          ...pub,
          slug: `${c.slug}-business-in-a-box`,
          packageType: 'business-in-the-box',
          price: 899,
          oldPrice: 2499,
          title: `${c.title} - Business in a Box`,
          subtitle: `Complete Business Plan + All ${c.categoryName} Business Playbooks`,
          imageUrl: c.boxImageUrl || pub.imageUrl,
          thumbnail: c.boxImageUrl || pub.thumbnail,
          bannerImage: c.boxImageUrl || pub.bannerImage,
        };
      }
      return pub;
    });

    res.json(mapped);
    return;
  }

  // Fallback Memory Filtering
  const isBoxFilter = type === 'business-in-the-box';
  const filtered = fallbackCourses.filter((course) => {
    let typeMatch = true;
    if (isBoxFilter) {
      typeMatch = (course as any).packageType === 'business-plans';
    } else if (type && ['business-plans', 'business-tools'].includes(type)) {
      typeMatch = (course as any).packageType === type;
    }

    let categoryMatch = true;
    if (targetCategory) {
      categoryMatch = course.categoryName === targetCategory;
    }

    const searchMatch = !search || course.title.toLowerCase().includes(search);
    return typeMatch && categoryMatch && searchMatch;
  });

  const mappedFallback = filtered.map((c) => {
    const pub = publicCourse(c);
    if (isBoxFilter) {
      return {
        ...pub,
        slug: `${c.slug}-business-in-a-box`,
        packageType: 'business-in-the-box',
        price: 899,
        oldPrice: 2499,
        title: c.title.includes('Business in a Box') ? c.title : `${c.title} - Business in a Box`,
        subtitle: `Complete Business Plan + All ${c.categoryName} Business Playbooks`,
        imageUrl: (c as any).boxImageUrl || pub.imageUrl,
        thumbnail: (c as any).boxImageUrl || pub.thumbnail,
        bannerImage: (c as any).boxImageUrl || pub.bannerImage,
      };
    }
    return pub;
  });

  res.json(mappedFallback);
});

app.get('/api/v1/courses/:slug', async (req, res) => {
  const rawSlug = req.params.slug.toLowerCase();
  const queryType = String(req.query.type || req.query.packageType || '').toLowerCase();
  const requestedBox =
    rawSlug.endsWith('-business-in-a-box') ||
    rawSlug.endsWith('-business-in-the-box') ||
    queryType === 'business-in-the-box' ||
    queryType === 'business-in-a-box';

  const cleanSlug = rawSlug
    .replace(/-business-in-a-box$/, '')
    .replace(/-business-in-the-box$/, '');

  console.log(`[GET /api/v1/courses/:slug] Fetching course by slug: "${rawSlug}" (clean: "${cleanSlug}", requestedBox: ${requestedBox})`);

  if (isMongoConnected()) {
    const course = await Course.findOne({
      slug: { $in: [rawSlug, cleanSlug] },
      isPublished: true,
    }).lean();

    if (course) {
      const isPlan = course.packageType === 'business-plans';
      // ONLY Business Plans can ever be viewed as Business in a Box! Business Tools are strictly standalone.
      const isBoxRequest = requestedBox && isPlan;

      const related = await Course.find({
        _id: { $ne: course._id },
        categoryName: course.categoryName,
        isPublished: true,
      }).sort({ rating: -1, createdAt: -1 }).limit(4).lean();

      let bundledTools: any[] = [];
      let basePlan: any = null;

      if (course.packageType === 'business-plans' || isBoxRequest) {
        bundledTools = await Course.find({
          categoryName: course.categoryName,
          packageType: 'business-tools',
          isPublished: true,
        }).sort({ title: 1 }).lean();

        basePlan = course;
      }

      let responseCourse = publicCourse(course);
      if (isBoxRequest) {
        const boxCover = course.boxImageUrl
          ? [{
              id: `${course.slug}-bib-cover`,
              url: course.boxImageUrl,
              label: `${course.title} - Business in a Box Cover`,
              caption: `${course.title} Business in a Box Cover`,
              alt: `${course.title} Business in a Box Cover`,
            }]
          : (course.gallery && course.gallery.length > 0)
            ? [course.gallery[0]]
            : [{
                id: `${course.slug}-cover`,
                url: course.thumbnail || course.imageUrl,
                label: `${course.title} - Cover`,
                caption: `${course.title} Cover`,
                alt: `${course.title} Cover`,
              }];

        const toolsGallery = bundledTools
          .filter((t) => t.imageUrl || t.thumbnail)
          .map((t, idx) => ({
            id: `box-tool-${t.slug || idx}`,
            url: t.imageUrl || t.thumbnail,
            label: `Playbook: ${t.title}`,
            caption: `Included Playbook: ${t.title}`,
            alt: `${t.title} Cover`,
          }));

        responseCourse = {
          ...responseCourse,
          slug: rawSlug.endsWith('-business-in-a-box') || rawSlug.endsWith('-business-in-the-box')
            ? rawSlug
            : `${course.slug}-business-in-a-box`,
          packageType: 'business-in-the-box',
          price: 899,
          oldPrice: 2499,
          title: course.title.includes('Business in a Box')
            ? course.title
            : `${course.title} - Business in a Box`,
          subtitle: `Complete Business Plan + All ${course.categoryName} Business Playbooks`,
          imageUrl: course.boxImageUrl || responseCourse.imageUrl,
          thumbnail: course.boxImageUrl || responseCourse.thumbnail,
          bannerImage: course.boxImageUrl || responseCourse.bannerImage,
          boxImageUrl: course.boxImageUrl || responseCourse.imageUrl,
          gallery: [...boxCover, ...toolsGallery],
        };
      }

      res.json({
        ...responseCourse,
        relatedCourses: related.map(publicCourse),
        bundledTools: bundledTools.map(publicCourse),
        basePlan: basePlan ? publicCourse(basePlan) : null,
      });
      return;
    }
  }

  const fallback = fallbackCourses.find((course) =>
    course.slug === rawSlug || course.slug === cleanSlug
  );
  if (fallback) {
    const isPlan = (fallback as any).packageType === 'business-plans';
    const isBoxRequest = requestedBox && isPlan;

    const relatedCourses = fallbackCourses
      .filter((course) => course.slug !== fallback.slug && course.categoryName === fallback.categoryName)
      .slice(0, 4);
    let responseCourse: any = { ...fallback, hasPdf: false, isPublished: true, relatedCourses };
    if (isBoxRequest) {
      responseCourse = {
        ...responseCourse,
        slug: rawSlug,
        packageType: 'business-in-the-box',
        price: 899,
        oldPrice: 2499,
        title: fallback.title.includes('Business in a Box') ? fallback.title : `${fallback.title} - Business in a Box`,
        subtitle: `Complete Business Plan + All ${fallback.categoryName} Business Playbooks`,
      };
    }
    res.json(responseCourse);
    return;
  }

  res.status(404).json({ message: 'Course not found' });
});

app.post('/api/v1/courses/:courseId/purchase', requireAuth, requireActiveSession, async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, isDeleted: false }).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      return res.status(500).json({ message: 'Payment gateway is not configured.' });
    }
    const isBox = (req.body?.isBox === true || req.body?.packageType === 'business-in-the-box' || req.body?.packageType === 'business-in-a-box') && course.packageType === 'business-plans';
    const effectivePrice = isBox ? 899 : Number(course.price || (course.packageType === 'business-plans' ? 399 : 299));
    console.log("Course Price", effectivePrice, "isBox:", isBox);
    const priceAmount = effectivePrice * 100;

    const instance = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });

    const options = {
      amount: Math.round(priceAmount),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`
    };

    const order = await instance.orders.create(options);
    res.json(order);
  } catch (error) {
    Logger.error('Order creation failed:', error);
    res.status(500).json({ message: 'Failed to initiate payment.' });
  }
});

app.post('/api/v1/courses/:courseId/verify-payment', requireAuth, requireActiveSession, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!config.razorpayKeySecret) {
      return res.status(500).json({ message: 'Payment gateway is not configured.' });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: 'Invalid payment signature.' });
    }

    const course = await Course.findOne({ _id: req.params.courseId, isDeleted: false }).lean();
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      await Enrollment.findOneAndUpdate(
        { user: res.locals.user.sub, course: course._id },
        {
          $set: {
            user: res.locals.user.sub,
            course: course._id,
            status: 'active',
            enrolledAt: new Date(),
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      const isBox = req.body?.isBox === true || req.body?.packageType === 'business-in-the-box' || req.body?.packageType === 'business-in-a-box';
      if (course) {
        const fulfillmentCourse = isBox ? { ...course, packageType: 'business-in-the-box' } : course;
        await fulfillBundleEnrollments(res.locals.user.sub, fulfillmentCourse);
      }

      try {
        await EmailService.sendCoursePurchase(
          { name: res.locals.user.name, email: res.locals.user.email },
          course.title
        );
      } catch (err) {
        Logger.error('Failed to send course purchase email', err);
      }

      return res.json({ message: 'Payment verified successfully.' });
  } catch (error) {
    Logger.error('Payment verification failed:', error);
    res.status(500).json({ message: 'Failed to verify payment.' });
  }
});

// ── Guest Purchase Flow ──

function createGuestToken(email: string, courseId: string, isBox = false): string {
  const payload = JSON.stringify({ email, courseId, isBox: Boolean(isBox), exp: Date.now() + 15 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', config.authSecret || 'local-development-auth-secret')
    .update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyGuestToken(token: string): { email: string; courseId: string; isBox?: boolean } | null {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', config.authSecret || 'local-development-auth-secret')
      .update(encoded).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.email || !payload.courseId || payload.exp < Date.now()) return null;
    return { email: payload.email, courseId: payload.courseId, isBox: Boolean(payload.isBox) };
  } catch {
    return null;
  }
}

app.post('/api/v1/courses/:courseId/guest-purchase', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database is not connected' });
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim() || 'Guest User';
    const courseId = String(req.params.courseId);

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const course = await Course.findOne({ _id: courseId, isPublished: true, isDeleted: { $ne: true } }).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existingUser = await User.findOne({ email }).select('_id').lean();
    if (existingUser) {
      const existingEnrollment = await Enrollment.findOne({
        user: existingUser._id,
        course: courseId,
        status: 'active',
      }).select('_id').lean();
      if (existingEnrollment) {
        return res.status(409).json({ message: 'You are already enrolled in this course.' });
      }
    }

    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      return res.status(500).json({ message: 'Payment gateway is not configured.' });
    }

    const isBox = (req.body?.isBox === true || req.body?.packageType === 'business-in-the-box' || req.body?.packageType === 'business-in-a-box') && course.packageType === 'business-plans';
    const effectivePrice = isBox ? 899 : Number(course.price || (course.packageType === 'business-plans' ? 399 : 299));
    const priceAmount = effectivePrice * 100;
    const instance = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });

    const order = await instance.orders.create({
      amount: Math.round(priceAmount),
      currency: 'INR',
      receipt: `rcpt_guest_${Date.now()}`,
    });

    const guestToken = createGuestToken(email, courseId, isBox);

    Logger.info('Guest purchase order created', { email, courseId, orderId: order.id, isBox });

    res.json({
      ...order,
      guestToken,
    });
  } catch (error) {
    Logger.error('Guest order creation failed:', error);
    res.status(500).json({ message: 'Failed to initiate payment.' });
  }
});

app.post('/api/v1/courses/:courseId/guest-verify-payment', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database is not connected' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, guestToken } = req.body;

    if (!guestToken) {
      return res.status(400).json({ message: 'Guest token is required' });
    }

    const guestData = verifyGuestToken(guestToken);
    if (!guestData) {
      return res.status(400).json({ message: 'Invalid or expired guest token' });
    }

    const courseId = String(req.params.courseId);
    if (guestData.courseId !== courseId) {
      return res.status(400).json({ message: 'Token does not match course' });
    }

    if (!config.razorpayKeySecret) {
      return res.status(500).json({ message: 'Payment gateway is not configured.' });
    }

    // Verify Razorpay signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: 'Invalid payment signature.' });
    }

    const course = await Course.findOne({ _id: courseId, isDeleted: { $ne: true } }).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find or create guest user
    let user = await User.findOne({ email: guestData.email }).select('_id name email isGuest passwordSetupToken');
    const passwordSetupToken = crypto.randomBytes(32).toString('hex');

    if (!user) {
      user = await User.create({
        name: req.body.name || 'Guest User',
        email: guestData.email,
        role: 'student',
        isGuest: true,
        isEmailVerified: false,
        passwordSetupToken,
      });
      Logger.info('Guest user auto-created', { email: guestData.email, userId: user._id });
    } else if (user.isGuest && !user.passwordSetupToken) {
      // Update password setup token for existing guest
      user.passwordSetupToken = passwordSetupToken;
      await user.save();
    }

    // Create enrollment with access token
    const accessToken = crypto.randomBytes(32).toString('hex');

    await Enrollment.findOneAndUpdate(
      { user: user._id, course: course._id },
      {
        $set: {
          user: user._id,
          course: course._id,
          status: 'active',
          enrolledAt: new Date(),
          accessToken,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    if (course) {
      const isBox = guestData.isBox || req.body?.isBox === true || req.body?.packageType === 'business-in-the-box' || req.body?.packageType === 'business-in-a-box';
      const fulfillmentCourse = isBox ? { ...course, packageType: 'business-in-the-box' } : course;
      await fulfillBundleEnrollments(user._id, fulfillmentCourse);
    }

    // Send guest purchase email
    const effectiveToken = user.passwordSetupToken || passwordSetupToken;
    try {
      await EmailService.sendGuestCoursePurchase(
        { name: user.name, email: user.email },
        course.title,
        accessToken,
        effectiveToken
      );
    } catch (err) {
      Logger.error('Failed to send guest course purchase email', err);
    }

    const frontendUrl = config.clientOrigins[0] || 'http://localhost:5173';
    const accessUrl = `${frontendUrl}/course-access/${accessToken}`;

    Logger.info('Guest payment verified and enrolled', { email: guestData.email, courseId });

    return res.json({ message: 'Payment verified successfully.', accessUrl });
  } catch (error) {
    Logger.error('Guest payment verification failed:', error);
    res.status(500).json({ message: 'Failed to verify payment.' });
  }
});

// ── Cart Purchase Flow ──

function createGuestCartToken(email: string, courseIds: string[]): string {
  const payload = JSON.stringify({ email, courseIds, exp: Date.now() + 15 * 60 * 1000 });
  const encoded = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', config.authSecret || 'local-development-auth-secret')
    .update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyGuestCartToken(token: string): { email: string; courseIds: string[] } | null {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', config.authSecret || 'local-development-auth-secret')
      .update(encoded).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.email || !Array.isArray(payload.courseIds) || payload.exp < Date.now()) return null;
    return { email: payload.email, courseIds: payload.courseIds };
  } catch {
    return null;
  }
}

app.post('/api/v1/cart/purchase', requireAuth, requireActiveSession, async (req, res) => {
  try {
    const { courseIds } = req.body;
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: 'No courses provided in cart' });
    }

    const courses = await Course.find({
      _id: { $in: courseIds },
      isDeleted: false,
    }).lean();

    if (courses.length === 0) {
      return res.status(404).json({ message: 'No valid courses found for purchase' });
    }

    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      return res.status(500).json({ message: 'Payment gateway is not configured.' });
    }

    const totalAmount = courses.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    const priceAmount = Math.max(1, Math.round(totalAmount * 100));

    const instance = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });

    const options = {
      amount: priceAmount,
      currency: 'INR',
      receipt: `rcpt_cart_${Date.now()}`,
    };

    const order = await instance.orders.create(options);
    res.json({ ...order, courseIds: courses.map((c) => c._id.toString()) });
  } catch (error) {
    Logger.error('Cart order creation failed:', error);
    res.status(500).json({ message: 'Failed to initiate cart payment.' });
  }
});

app.post('/api/v1/cart/verify-payment', requireAuth, requireActiveSession, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseIds } = req.body;

    if (!config.razorpayKeySecret) {
      return res.status(500).json({ message: 'Payment gateway is not configured.' });
    }

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: 'Course IDs required' });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: 'Invalid payment signature.' });
    }

    const courses = await Course.find({ _id: { $in: courseIds }, isDeleted: false }).lean();
    if (courses.length === 0) {
      return res.status(404).json({ message: 'Courses not found' });
    }

    for (const course of courses) {
      await Enrollment.findOneAndUpdate(
        { user: res.locals.user.sub, course: course._id },
        {
          $set: {
            user: res.locals.user.sub,
            course: course._id,
            status: 'active',
            enrolledAt: new Date(),
            isDeleted: false,
          },
        },
        { upsert: true, new: true }
      );
    }

    const user = await User.findById(res.locals.user.sub).select('name email').lean();
    if (user) {
      try {
        const titles = courses.map((c) => c.title).join(', ');
        await EmailService.sendCoursePurchase({ name: user.name, email: user.email }, titles);
      } catch (err) {
        Logger.error('Failed to send cart purchase email', err);
      }
    }

    res.json({ message: 'Payment verified and solutions unlocked successfully.' });
  } catch (error) {
    Logger.error('Cart payment verification failed:', error);
    res.status(500).json({ message: 'Failed to verify payment.' });
  }
});

app.post('/api/v1/cart/guest-purchase', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database is not connected' });
    }

    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim() || 'Guest User';
    const { courseIds } = req.body;

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ message: 'At least one course is required' });
    }

    const courses = await Course.find({
      _id: { $in: courseIds },
      isPublished: true,
      isDeleted: { $ne: true },
    }).lean();

    if (courses.length === 0) {
      return res.status(404).json({ message: 'No valid courses found' });
    }

    if (!config.razorpayKeyId || !config.razorpayKeySecret) {
      return res.status(500).json({ message: 'Payment gateway is not configured.' });
    }

    const validCourseIds = courses.map((c) => c._id.toString());
    const totalAmount = courses.reduce((sum, c) => sum + (Number(c.price) || 0), 0);
    const priceAmount = Math.max(1, Math.round(totalAmount * 100));

    const instance = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });

    const order = await instance.orders.create({
      amount: priceAmount,
      currency: 'INR',
      receipt: `rcpt_guest_cart_${Date.now()}`,
    });

    const guestToken = createGuestCartToken(email, validCourseIds);

    res.json({
      ...order,
      guestToken,
      courseIds: validCourseIds,
    });
  } catch (error) {
    Logger.error('Guest cart order creation failed:', error);
    res.status(500).json({ message: 'Failed to initiate guest cart payment.' });
  }
});

app.post('/api/v1/cart/guest-verify-payment', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ message: 'Database is not connected' });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, guestToken, courseIds } = req.body;

    if (!guestToken) {
      return res.status(400).json({ message: 'Guest token is required' });
    }

    const guestData = verifyGuestCartToken(guestToken);
    if (!guestData) {
      return res.status(400).json({ message: 'Invalid or expired guest token' });
    }

    if (!config.razorpayKeySecret) {
      return res.status(500).json({ message: 'Payment gateway is not configured.' });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({ message: 'Invalid payment signature.' });
    }

    const targetCourseIds = Array.isArray(courseIds) && courseIds.length > 0 ? courseIds : guestData.courseIds;
    const courses = await Course.find({ _id: { $in: targetCourseIds }, isDeleted: { $ne: true } }).lean();

    if (courses.length === 0) {
      return res.status(404).json({ message: 'No valid courses found' });
    }

    let user = await User.findOne({ email: guestData.email }).select('_id name email isGuest passwordSetupToken');
    const passwordSetupToken = crypto.randomBytes(32).toString('hex');

    if (!user) {
      user = await User.create({
        name: req.body.name || 'Guest User',
        email: guestData.email,
        role: 'student',
        isGuest: true,
        isEmailVerified: false,
        passwordSetupToken,
      });
    } else if (user.isGuest && !user.passwordSetupToken) {
      user.passwordSetupToken = passwordSetupToken;
      await user.save();
    }

    const frontendUrl = config.clientOrigins[0] || 'http://localhost:5173';
    const accessUrls: { title: string; url: string }[] = [];

    for (const course of courses) {
      const accessToken = crypto.randomBytes(32).toString('hex');
      await Enrollment.findOneAndUpdate(
        { user: user._id, course: course._id },
        {
          $set: {
            user: user._id,
            course: course._id,
            status: 'active',
            enrolledAt: new Date(),
            accessToken,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );
      accessUrls.push({
        title: course.title,
        url: `${frontendUrl}/course-access/${accessToken}`,
      });
    }

    const effectiveToken = user.passwordSetupToken || passwordSetupToken;
    try {
      for (const item of accessUrls) {
        const token = item.url.split('/').pop() || '';
        await EmailService.sendGuestCoursePurchase(
          { name: user.name, email: user.email },
          item.title,
          token,
          effectiveToken
        );
      }
    } catch (err) {
      Logger.error('Failed to send guest cart course purchase emails', err);
    }

    return res.json({
      message: 'Payment verified successfully.',
      accessUrls,
      accessUrl: accessUrls[0]?.url,
    });
  } catch (error) {
    Logger.error('Guest cart payment verification failed:', error);
    res.status(500).json({ message: 'Failed to verify payment.' });
  }
});

// ── Token-based Course Access (for guest users) ──

app.get('/api/v1/courses/access/:accessToken', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const accessToken = String(req.params.accessToken);
  if (!accessToken || accessToken.length < 32) {
    res.status(400).json({ message: 'Invalid access token' });
    return;
  }

  const enrollment = await Enrollment.findOne({ accessToken, status: 'active' })
    .populate('user', 'name email')
    .populate('course')
    .lean();

  if (!enrollment || !enrollment.user || !enrollment.course) {
    res.status(404).json({ message: 'Invalid or revoked access link. Please contact support.' });
    return;
  }

  const course = enrollment.course as any;
  const user = enrollment.user as any;

  if (!course.isPublished) {
    res.status(404).json({ message: 'This course is no longer available.' });
    return;
  }

  const pdf = await CoursePdf.findOne({ course: course._id }).select('filename fileSize storageType').lean();
  if (!pdf) {
    res.status(404).json({ message: 'No PDF is attached to this course' });
    return;
  }

  await logPdfAccess(req, String(user._id), String(course._id), 'manifest');

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    course: publicCourse(course),
    pdf: {
      filename: pdf.filename,
      fileSize: pdf.fileSize,
      streamUrl: `/api/v1/courses/access/${accessToken}/file`,
    },
    watermark: {
      name: user.name || 'Guest',
      email: user.email,
      userId: String(user._id),
      courseName: course.title,
      issuedAt: new Date().toISOString(),
    },
  });
});

app.get('/api/v1/courses/access/:accessToken/file', async (req, res) => {
  if (!isMongoConnected()) {
    res.status(503).json({ message: 'Database is not connected' });
    return;
  }

  const accessToken = String(req.params.accessToken);
  if (!accessToken || accessToken.length < 32) {
    res.status(400).json({ message: 'Invalid access token' });
    return;
  }

  const enrollment = await Enrollment.findOne({ accessToken, status: 'active' })
    .select('user course')
    .lean();

  if (!enrollment) {
    res.status(404).json({ message: 'Invalid or revoked access link.' });
    return;
  }

  const course = await Course.findOne({ _id: enrollment.course, isPublished: true }).select('_id title').lean();
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return;
  }

  const pdf = await CoursePdf.findOne({ course: course._id }).select('+data +externalUrl filename mimeType fileSize storageType').lean();
  if (!pdf) {
    res.status(404).json({ message: 'No PDF is attached to this course' });
    return;
  }

  await logPdfAccess(req, String(enrollment.user), String(course._id), 'stream');

  if (pdf.storageType === 'external') {
    if (!pdf.externalUrl) {
      res.status(404).json({ message: 'PDF URL is missing' });
      return;
    }
    const safeExternalUrl = await validateExternalPdfUrl(pdf.externalUrl);
    let response = await fetch(safeExternalUrl, {
      redirect: 'error',
      signal: AbortSignal.timeout(config.externalPdfFetchTimeoutMs),
    });
    if (!response.ok || !response.body) {
      Logger.warn(`Guest PDF not found at ${safeExternalUrl}, trying default fallback PDF`);
      const fallbackUrl = 'https://pub-eaf43b6e4e2a484d829c060e1d1b651a.r2.dev/uploads/pdfs/1.pdf';
      try {
        const fallbackResponse = await fetch(fallbackUrl, {
          signal: AbortSignal.timeout(config.externalPdfFetchTimeoutMs),
        });
        if (fallbackResponse.ok && fallbackResponse.body) {
          response = fallbackResponse;
        }
      } catch {
        // ignore
      }
    }
    if (!response.ok || !response.body) {
      res.status(502).json({ message: 'Unable to retrieve secure PDF asset' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Content-Disposition', `inline; filename="${safePdfFilename(pdf.filename)}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const readable = Readable.fromWeb(response.body as any);
    readable.on('error', (err) => {
      console.warn('PDF stream interrupted:', err.message);
      if (!res.writableEnded) res.end();
    });
    res.on('close', () => {
      readable.destroy();
    });
    readable.pipe(res);
    return;
  } else if (pdf.data) {
    const storedBuffer = pdfDataToBuffer(pdf.data);
    if (!storedBuffer) {
      res.status(500).json({ message: 'Stored PDF data could not be read' });
      return;
    }
    if (storedBuffer.length > config.maxPdfUploadBytes || storedBuffer.subarray(0, 5).toString('utf8') !== '%PDF-') {
      res.status(502).json({ message: 'Secure PDF asset failed validation' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(storedBuffer.length));
    res.setHeader('Content-Disposition', `inline; filename="${safePdfFilename(pdf.filename)}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(storedBuffer);
  } else {
    res.status(404).json({ message: 'PDF data is missing' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(JSON.stringify({
    level: 'error',
    time: new Date().toISOString(),
    message: error.message,
    stack: config.isProduction ? undefined : error.stack,
  }));

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    message: config.isProduction ? 'Internal server error' : error.message,
  });
});

async function start() {
  if (config.mongodbUri) {
    try {
      await mongoose.connect(config.mongodbUri, {
        autoIndex: !config.isProduction,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
      });
      console.log('MongoDB connected');
      // await seedDemoContent();
      // console.log('Demo content synced to MongoDB');
    } catch (error) {
      console.error('MongoDB Error:', error);
      if (config.isProduction) {
        process.exit(1);
      }
    }
  }

  app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
  });
}

void start();
