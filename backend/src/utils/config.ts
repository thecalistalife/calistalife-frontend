import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Ensure environment variables are loaded regardless of import order
// Resolve to project root .env from both src and dist builds
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export type ProviderName = 'sendgrid' | 'brevo' | 'mailgun' | 'smtp';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().optional(),

  // Frontend URL for links in emails
  CLIENT_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),

  // Email common
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  EMAIL_PROVIDER_PRIORITY: z.string().optional(), // e.g. "sendgrid,mailgun,smtp"

  // SendGrid
  SENDGRID_API_KEY: z.string().optional(),

  // Mailgun
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),

  // SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Sentry / Monitoring
  SENTRY_DSN: z.string().optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Auth
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRE: z.string().optional(),
  REFRESH_TOKEN_EXPIRE: z.string().optional(),

  // Brevo (SMS + Email alternative)
  BREVO_API_KEY: z.string().optional(),
  BREVO_SMS_SENDER: z.string().optional(),
  ORDER_EMAIL_BCC: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  // Don't crash, but log the issues
  console.warn('Environment validation warnings:', _env.error.flatten());
}

const env = _env.success ? _env.data : ({} as any);

const priority = (env.EMAIL_PROVIDER_PRIORITY || 'sendgrid,brevo,mailgun,smtp')
  .split(',')
  .map((s: string) => s.trim().toLowerCase())
  .filter((s: string) => s === 'sendgrid' || s === 'brevo' || s === 'mailgun' || s === 'smtp') as ProviderName[];

export const config: {
  NODE_ENV: string;
  PORT?: number;
  CLIENT_URL: string;
  EMAIL_FROM?: string;
  EMAIL_FROM_NAME?: string;
  EMAIL_PROVIDER_PRIORITY: ProviderName[];
  SENDGRID_API_KEY?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  SMTP_HOST?: string;
  SMTP_PORT: number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SENTRY_DSN?: string;
  GOOGLE_CLIENT_ID?: string;
  JWT_SECRET?: string;
  JWT_EXPIRE?: string;
  REFRESH_TOKEN_EXPIRE?: string;
  BREVO_API_KEY?: string;
  BREVO_SMS_SENDER?: string;
  ORDER_EMAIL_BCC?: string;
} = {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT ? parseInt(env.PORT, 10) : undefined,
  CLIENT_URL: env.CLIENT_URL || env.FRONTEND_URL || 'http://localhost:5174',

  EMAIL_FROM: env.EMAIL_FROM,
  EMAIL_FROM_NAME: env.EMAIL_FROM_NAME,
  EMAIL_PROVIDER_PRIORITY: priority.length ? (priority as ProviderName[]) : ['sendgrid','brevo','mailgun','smtp'],

  SENDGRID_API_KEY: env.SENDGRID_API_KEY,

  MAILGUN_API_KEY: env.MAILGUN_API_KEY,
  MAILGUN_DOMAIN: env.MAILGUN_DOMAIN,

  SMTP_HOST: env.SMTP_HOST,
  SMTP_PORT: parseInt(env.SMTP_PORT || '587', 10),
  SMTP_USER: env.SMTP_USER,
  SMTP_PASS: env.SMTP_PASS,

  SENTRY_DSN: env.SENTRY_DSN,

  GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,

  JWT_SECRET: env.JWT_SECRET,
  JWT_EXPIRE: env.JWT_EXPIRE,
  REFRESH_TOKEN_EXPIRE: env.REFRESH_TOKEN_EXPIRE,

  // Allow fallback: if BREVO_API_KEY not provided, use SMTP_API_KEY (Brevo transactional API key)
  BREVO_API_KEY: env.BREVO_API_KEY || (env as any).SMTP_API_KEY,
  BREVO_SMS_SENDER: env.BREVO_SMS_SENDER,
  ORDER_EMAIL_BCC: env.ORDER_EMAIL_BCC,
} as const;
