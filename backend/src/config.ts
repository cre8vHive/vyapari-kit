import dotenv from 'dotenv';

dotenv.config();

const localClientOrigin = 'http://localhost:5173';
const defaultJsonBodyLimit = '15mb';
const defaultMaxPdfUploadBytes = 15 * 1024 * 1024;

function csv(value?: string) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberFromEnv(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return value;
}

function originsFromEnv() {
  const origins = csv(process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN);
  if (origins.length === 0 && process.env.NODE_ENV !== 'production') {
    origins.push(localClientOrigin);
  }

  return origins.map((origin) => {
    const parsed = new URL(origin);
    if (parsed.origin !== origin.replace(/\/$/, '')) {
      throw new Error(`CLIENT_ORIGINS must contain origins only, not paths: ${origin}`);
    }
    return parsed.origin;
  });
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: numberFromEnv('PORT', 5000),
  mongodbUri: process.env.MONGODB_URI || '',
  authSecret: process.env.AUTH_SECRET || '',
  clientOrigins: originsFromEnv(),
  adminEmails: csv(process.env.ADMIN_EMAILS).map((email) => email.toLowerCase()),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || defaultJsonBodyLimit,
  maxPdfUploadBytes: numberFromEnv('MAX_PDF_UPLOAD_BYTES', defaultMaxPdfUploadBytes),
  allowedPdfHostnames: csv(process.env.PDF_ALLOWED_HOSTNAMES).map((host) => host.toLowerCase()),
  externalPdfFetchTimeoutMs: numberFromEnv('EXTERNAL_PDF_FETCH_TIMEOUT_MS', 10_000),
  trustProxyHops: numberFromEnv('TRUST_PROXY_HOPS', 1),
  rateLimitWindowMs: numberFromEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  rateLimitMax: numberFromEnv('RATE_LIMIT_MAX', 300),
  authRateLimitMax: numberFromEnv('AUTH_RATE_LIMIT_MAX', 10),
  pdfRateLimitMax: numberFromEnv('PDF_RATE_LIMIT_MAX', 120),
  brevoApiKey: process.env.BREVO_API_KEY || '',
  emailSender: process.env.EMAIL_SENDER || 'no-reply@vyapari.kit',
};

export function validateConfig() {
  const errors: string[] = [];

  if (config.clientOrigins.length === 0) {
    errors.push('CLIENT_ORIGINS must include your production frontend origin');
  }

  if (config.isProduction) {
    if (!config.mongodbUri) {
      errors.push('MONGODB_URI is required in production');
    }
    if (!config.mongodbUri.startsWith('mongodb+srv://')) {
      errors.push('MONGODB_URI should use the MongoDB Atlas mongodb+srv:// connection string in production');
    }
    if (!config.authSecret || config.authSecret.length < 32 || config.authSecret === 'local-development-auth-secret') {
      errors.push('AUTH_SECRET must be a unique random value of at least 32 characters in production');
    }
    if (config.clientOrigins.some((origin) => origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      errors.push('CLIENT_ORIGINS must not include localhost origins in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }
}
