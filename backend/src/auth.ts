import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp: number;
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url');
}

function getAuthSecret() {
  return process.env.AUTH_SECRET || 'local-development-auth-secret';
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');

  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export function createToken(user: { id: string; email: string; name: string; role: string }) {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const body = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', getAuthSecret())
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) return null;

  const expected = crypto
    .createHmac('sha256', getAuthSecret())
    .update(`${header}.${body}`)
    .digest('base64url');

  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!isValid) return null;

  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  res.locals.user = payload;
  next();
}
