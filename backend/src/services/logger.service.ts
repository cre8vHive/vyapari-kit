import crypto from 'crypto';
import { Request } from 'express';
import { clientIp } from '../security';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY' | 'AUDIT';

interface LogContext {
  requestId?: string;
  cfRay?: string;
  ip?: string;
  userAgent?: string;
  userId?: string | any;
  durationMs?: number;
  statusCode?: number;
  [key: string]: any;
}

export class Logger {
  private static scrub(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;

    const scrubbed = { ...data };
    const sensitiveKeys = ['password', 'passwordHash', 'token', 'jwt', 'secret', 'apikey', 'creditcard'];

    for (const key of Object.keys(scrubbed)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        scrubbed[key] = '[REDACTED]';
      } else if (typeof scrubbed[key] === 'object') {
        scrubbed[key] = this.scrub(scrubbed[key]);
      }
    }
    return scrubbed;
  }

  private static log(level: LogLevel, message: string, context?: LogContext) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.scrub(context),
    };
    
    // Output as structured JSON for easy querying in log aggregation tools
    console.log(JSON.stringify(logEntry));
  }

  static extractReqContext(req: Request, res?: any): LogContext {
    return {
      requestId: req.header('cf-ray') || req.header('x-request-id') || crypto.randomUUID(),
      cfRay: req.header('cf-ray'),
      ip: clientIp(req),
      userAgent: req.header('user-agent'),
      userId: res?.locals?.user?.sub,
      path: req.originalUrl,
      method: req.method,
    };
  }

  static info(message: string, context?: LogContext) {
    this.log('INFO', message, context);
  }

  static warn(message: string, context?: LogContext) {
    this.log('WARN', message, context);
  }

  static error(message: string, error?: any, context?: LogContext) {
    const errorDetails = error instanceof Error ? { errorMsg: error.message, stack: error.stack } : { error };
    this.log('ERROR', message, { ...context, ...errorDetails });
  }

  static security(message: string, context?: LogContext) {
    this.log('SECURITY', message, context);
  }

  static audit(event: string, context?: LogContext) {
    this.log('AUDIT', event, context);
  }
}
