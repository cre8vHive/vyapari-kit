import compression from 'compression';
import cors, { CorsOptions } from 'cors';
import crypto from 'crypto';
import dns from 'dns/promises';
import { NextFunction, Request, Response } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import helmet from 'helmet';
import net from 'net';
import path from 'path';
import { config } from './config';

const noCacheValue = 'no-store, no-cache, must-revalidate, proxy-revalidate, private';

export function clientIp(req: Request) {
  return (
    req.header('cf-connecting-ip') ||
    req.header('true-client-ip') ||
    req.header('x-real-ip') ||
    (req.header('x-forwarded-for') || '').split(',')[0].trim() ||
    req.ip ||
    'unknown'
  );
}

function rateLimitKey(req: Request, suffix = '') {
  const ip = clientIp(req);
  const key = net.isIP(ip) ? ipKeyGenerator(ip) : ip;
  return suffix ? `${key}:${suffix}` : key;
}

function rateLimitResponse(_req: Request, res: Response) {
  res.status(429).json({ message: 'Too many requests. Please try again later.' });
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || config.clientOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'RateLimit', 'RateLimit-Policy'],
  maxAge: 600,
};

export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
    strictTransportSecurity: config.isProduction
      ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
      : false,
  });
}

export function permissionsPolicy(_req: Request, res: Response, next: NextFunction) {
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()'
  );
  next();
}

export function apiNoStore(_req: Request, res: Response, next: NextFunction) {
  // API and PDF responses must never be cached by browsers, Vercel, Render, or Cloudflare.
  res.setHeader('Cache-Control', noCacheValue);
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
}

export function accessLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = process.hrtime.bigint();
  const requestId = req.header('cf-ray') || crypto.randomUUID();
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const log = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      time: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: clientIp(req),
      userAgent: req.header('user-agent'),
      cfRay: req.header('cf-ray'),
    };
    console.log(JSON.stringify(log));
  });

  next();
}

export const generalApiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  limit: config.rateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => rateLimitKey(req),
  handler: rateLimitResponse,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return rateLimitKey(req, email || 'anonymous-auth');
  },
  handler: rateLimitResponse,
});

export const pdfLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: config.pdfRateLimitMax,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => rateLimitKey(req, 'pdf'),
  handler: rateLimitResponse,
});

export const responseCompression = compression({
  filter(req, res) {
    if (req.path.includes('/pdf/file')) return false;
    return compression.filter(req, res);
  },
});

export function safePdfFilename(filename: string) {
  const basename = path.basename(filename || 'course-material.pdf');
  const cleaned = basename.replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-').slice(0, 120);
  const safeName = cleaned || 'course-material.pdf';
  return safeName.toLowerCase().endsWith('.pdf') ? safeName : `${safeName}.pdf`;
}

function isPrivateIp(ip: string) {
  if (ip === '::1' || ip === '127.0.0.1') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith('169.254.') || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;
  return false;
}

function isAllowedPdfHost(hostname: string) {
  if (config.allowedPdfHostnames.length === 0) {
    return !config.isProduction;
  }

  const normalized = hostname.toLowerCase();
  return config.allowedPdfHostnames.some((allowedHost) => {
    if (allowedHost.startsWith('*.')) {
      const suffix = allowedHost.slice(1);
      return normalized.endsWith(suffix) && normalized !== suffix.slice(1);
    }
    return normalized === allowedHost;
  });
}

export async function validateExternalPdfUrl(value: string) {
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') {
    throw new Error('PDF URL must use HTTPS');
  }
  if (!isAllowedPdfHost(parsed.hostname)) {
    throw new Error('PDF URL hostname is not allowed');
  }

  const addresses = net.isIP(parsed.hostname)
    ? [{ address: parsed.hostname }]
    : await dns.lookup(parsed.hostname, { all: true });

  if (addresses.some((address) => isPrivateIp(address.address))) {
    throw new Error('PDF URL must not resolve to a private network address');
  }

  return parsed.toString();
}
