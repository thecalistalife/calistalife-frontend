// Brevo Security & Best Practices Implementation
// Secure API key management, webhook validation, and rate limiting

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { config } from '@/utils/config';

// Rate limiting for email sending
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMITS = {
  EMAIL_PER_HOUR: 100, // Per email address
  EMAIL_PER_DAY: 300, // Total daily limit for free tier
  WEBHOOK_PER_MINUTE: 60, // Webhook requests per minute
};

// Daily usage counter
let dailyEmailCount = { date: '', count: 0 };

// Validate Brevo webhook signature
export function validateBrevoWebhook(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get signature from headers
      const signature = req.headers['x-brevo-signature'] as string;
      if (!signature) {
        logger.warn({ ip: req.ip, url: req.url }, 'Missing webhook signature');
        return res.status(401).json({ error: 'Missing signature' });
      }

      // Compute expected signature
      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // Verify signature
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        logger.error({ 
          ip: req.ip, 
          signature: signature.substring(0, 10) + '...', 
          url: req.url 
        }, 'Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      logger.info({ ip: req.ip, url: req.url }, 'Webhook signature validated');
      next();
    } catch (error) {
      logger.error({ error, ip: req.ip }, 'Webhook signature validation failed');
      res.status(401).json({ error: 'Signature validation failed' });
    }
  };
}

// Rate limiting middleware for webhooks
export function rateLimitWebhook(req: Request, res: Response, next: NextFunction) {
  const key = `webhook:${req.ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  let usage = rateLimitStore.get(key);
  if (!usage || now > usage.resetTime) {
    usage = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(key, usage);
  }

  if (usage.count >= RATE_LIMITS.WEBHOOK_PER_MINUTE) {
    logger.warn({ 
      ip: req.ip, 
      count: usage.count, 
      limit: RATE_LIMITS.WEBHOOK_PER_MINUTE 
    }, 'Webhook rate limit exceeded');
    
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      resetTime: usage.resetTime 
    });
  }

  usage.count++;
  next();
}

// Check email sending rate limits
export function checkEmailRateLimit(email: string): { allowed: boolean; reason?: string; resetTime?: number } {
  const now = Date.now();

  // Check daily limit
  const today = new Date().toISOString().split('T')[0];
  if (dailyEmailCount.date !== today) {
    dailyEmailCount = { date: today, count: 0 };
  }

  if (dailyEmailCount.count >= RATE_LIMITS.EMAIL_PER_DAY) {
    return {
      allowed: false,
      reason: 'Daily email limit reached',
      resetTime: new Date().setHours(24, 0, 0, 0), // Next day
    };
  }

  // Check per-email hourly limit
  const hourlyKey = `email:${email}`;
  const windowMs = 60 * 60 * 1000; // 1 hour window

  let usage = rateLimitStore.get(hourlyKey);
  if (!usage || now > usage.resetTime) {
    usage = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(hourlyKey, usage);
  }

  if (usage.count >= RATE_LIMITS.EMAIL_PER_HOUR) {
    return {
      allowed: false,
      reason: 'Hourly email limit exceeded for this address',
      resetTime: usage.resetTime,
    };
  }

  return { allowed: true };
}

// Track email sending
export function trackEmailSent(email: string): void {
  const now = Date.now();

  // Update daily counter
  const today = new Date().toISOString().split('T')[0];
  if (dailyEmailCount.date !== today) {
    dailyEmailCount = { date: today, count: 0 };
  }
  dailyEmailCount.count++;

  // Update per-email counter
  const hourlyKey = `email:${email}`;
  const windowMs = 60 * 60 * 1000;

  let usage = rateLimitStore.get(hourlyKey);
  if (!usage || now > usage.resetTime) {
    usage = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(hourlyKey, usage);
  }
  usage.count++;

  logger.info({ 
    email, 
    dailyCount: dailyEmailCount.count, 
    dailyLimit: RATE_LIMITS.EMAIL_PER_DAY,
    hourlyCount: usage.count,
    hourlyLimit: RATE_LIMITS.EMAIL_PER_HOUR
  }, 'Email sent - usage tracked');
}

// Sanitize email content to prevent injection
export function sanitizeEmailContent(content: string): string {
  // Remove potentially dangerous HTML tags and scripts
  const dangerous = /<script[^>]*>.*?<\/script>/gis;
  const iframe = /<iframe[^>]*>.*?<\/iframe>/gis;
  const object = /<object[^>]*>.*?<\/object>/gis;
  const embed = /<embed[^>]*>.*?<\/embed>/gis;
  
  return content
    .replace(dangerous, '')
    .replace(iframe, '')
    .replace(object, '')
    .replace(embed, '')
    .trim();
}

// Validate email addresses
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Basic format validation
  if (!emailRegex.test(email)) {
    return false;
  }

  // Check for common invalid patterns
  const invalidPatterns = [
    /\.{2,}/, // Multiple consecutive dots
    /^\./, // Starts with dot
    /\.$/, // Ends with dot
    /@.*@/, // Multiple @ symbols
  ];

  return !invalidPatterns.some(pattern => pattern.test(email));
}

// Secure API key rotation helper
export function rotateApiKeys(): {
  current: string;
  previous: string;
  rotationDate: string;
  nextRotation: string;
} {
  const current = config.BREVO_API_KEY || '';
  const previous = process.env.BREVO_API_KEY_PREVIOUS || '';
  const rotationDate = process.env.LAST_KEY_ROTATION || new Date().toISOString();
  
  // Calculate next rotation (monthly)
  const nextRotation = new Date();
  nextRotation.setMonth(nextRotation.getMonth() + 1);

  return {
    current,
    previous,
    rotationDate,
    nextRotation: nextRotation.toISOString(),
  };
}

// Audit logging for security events
export function auditLog(event: string, details: Record<string, any>, req?: Request): void {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req?.ip,
    userAgent: req?.headers['user-agent'],
    requestId: req?.headers['x-request-id'],
  };

  logger.info(auditEntry, `AUDIT: ${event}`);

  // In production, you might want to send audit logs to a separate secure system
}

// Middleware to ensure API keys are never exposed in responses
export function sanitizeResponse(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    // Remove sensitive fields from response body
    const sanitized = sanitizeObjectRecursively(body, [
      'api_key',
      'apiKey',
      'password',
      'token',
      'secret',
      'brevo_api_key',
      'BREVO_API_KEY',
    ]);
    
    return originalJson.call(this, sanitized);
  };
  
  next();
}

// Helper function to recursively sanitize objects
function sanitizeObjectRecursively(obj: any, sensitiveKeys: string[]): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectRecursively(item, sensitiveKeys));
  }

  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeObjectRecursively(sanitized[key], sensitiveKeys);
    }
  }

  return sanitized;
}

// Health check for security configuration
export function getSecurityHealthCheck(): {
  status: 'healthy' | 'warning' | 'critical';
  checks: Record<string, { status: boolean; message: string }>;
} {
  const checks: Record<string, { status: boolean; message: string }> = {};

  // Check API key configuration
  checks.apiKeyConfigured = {
    status: !!config.BREVO_API_KEY,
    message: config.BREVO_API_KEY ? 'API key configured' : 'API key missing',
  };

  // Check webhook secret configuration
  const webhookSecret = process.env.BREVO_WEBHOOK_SECRET;
  checks.webhookSecretConfigured = {
    status: !!webhookSecret,
    message: webhookSecret ? 'Webhook secret configured' : 'Webhook secret missing',
  };

  // Check rate limiting
  const dailyUsage = dailyEmailCount.count / RATE_LIMITS.EMAIL_PER_DAY;
  checks.dailyUsage = {
    status: dailyUsage < 0.9,
    message: `Daily usage: ${(dailyUsage * 100).toFixed(1)}% of limit`,
  };

  // Check for suspicious activity
  const suspiciousIPs = Array.from(rateLimitStore.keys())
    .filter(key => key.startsWith('webhook:'))
    .filter(key => {
      const usage = rateLimitStore.get(key);
      return usage && usage.count > RATE_LIMITS.WEBHOOK_PER_MINUTE * 0.8;
    });

  checks.suspiciousActivity = {
    status: suspiciousIPs.length === 0,
    message: suspiciousIPs.length > 0 
      ? `${suspiciousIPs.length} IPs with high webhook activity` 
      : 'No suspicious activity detected',
  };

  // Determine overall status
  const hasFailures = Object.values(checks).some(check => !check.status);
  const hasCriticalFailures = !checks.apiKeyConfigured.status || !checks.webhookSecretConfigured.status;

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (hasCriticalFailures) {
    status = 'critical';
  } else if (hasFailures) {
    status = 'warning';
  }

  return { status, checks };
}

// Cleanup rate limit store (run periodically)
export function cleanupRateLimitStore(): { removed: number; remaining: number } {
  const now = Date.now();
  let removed = 0;

  for (const [key, usage] of rateLimitStore.entries()) {
    if (now > usage.resetTime) {
      rateLimitStore.delete(key);
      removed++;
    }
  }

  logger.info({ removed, remaining: rateLimitStore.size }, 'Rate limit store cleanup completed');
  return { removed, remaining: rateLimitStore.size };
}

// Export security configuration for monitoring
export function getSecurityMetrics(): {
  rateLimits: typeof RATE_LIMITS;
  dailyUsage: typeof dailyEmailCount;
  activeKeys: number;
  suspiciousActivity: {
    highVolumeIPs: string[];
    blockedRequests: number;
  };
} {
  const now = Date.now();
  const highVolumeIPs = Array.from(rateLimitStore.keys())
    .filter(key => key.startsWith('webhook:'))
    .filter(key => {
      const usage = rateLimitStore.get(key);
      return usage && usage.count > RATE_LIMITS.WEBHOOK_PER_MINUTE * 0.7 && now <= usage.resetTime;
    })
    .map(key => key.replace('webhook:', ''));

  return {
    rateLimits: RATE_LIMITS,
    dailyUsage: dailyEmailCount,
    activeKeys: rateLimitStore.size,
    suspiciousActivity: {
      highVolumeIPs,
      blockedRequests: 0, // Would track this in a real implementation
    },
  };
}