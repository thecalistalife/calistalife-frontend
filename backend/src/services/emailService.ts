import type { MailDataRequired } from '@sendgrid/mail';
import sgMail from '@sendgrid/mail';
import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { config, type ProviderName } from '@/utils/config';
import { logger } from '@/utils/logger';

export type EmailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  category?: string;
  messageIdempotencyKey?: string;
  bcc?: string | string[];
};

class EmailService {
  private providers: ProviderName[];
  private brevoApi?: any;
  
  constructor() {
    this.providers = config.EMAIL_PROVIDER_PRIORITY;

    // Configure SendGrid if available
    if (config.SENDGRID_API_KEY) {
      sgMail.setApiKey(config.SENDGRID_API_KEY);
    }

    // Configure Brevo if available
    if (config.BREVO_API_KEY) {
      const SibApiV3Sdk = require('sib-api-v3-sdk');
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = config.BREVO_API_KEY;
      this.brevoApi = new SibApiV3Sdk.TransactionalEmailsApi();
    }
  }

  private async sendWithSendGrid(payload: EmailPayload) {
    if (!config.SENDGRID_API_KEY || !config.EMAIL_FROM) throw new Error('SendGrid not configured');
    const data: MailDataRequired = {
      to: payload.to,
      from: { email: config.EMAIL_FROM, name: config.EMAIL_FROM_NAME || 'TheCalista' },
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      categories: payload.category ? [payload.category] : undefined,
      headers: payload.messageIdempotencyKey ? { 'Idempotency-Key': payload.messageIdempotencyKey } as any : undefined,
      bcc: payload.bcc ? (Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc]) : undefined,
    } as any;
    const [resp] = await sgMail.send(data, false);
    const msgId = resp.headers['x-message-id'] || resp.headers['x-message-id'.toLowerCase()];
    return { provider: 'sendgrid' as ProviderName, messageId: Array.isArray(msgId) ? msgId[0] : msgId };
  }

  private async sendWithBrevo(payload: EmailPayload) {
    if (!this.brevoApi || !config.EMAIL_FROM) throw new Error('Brevo not configured');
    
    const sendSmtpEmail = {
      sender: { email: config.EMAIL_FROM, name: config.EMAIL_FROM_NAME || 'CalistaLife' },
      to: [{ email: payload.to }],
      bcc: payload.bcc ? (Array.isArray(payload.bcc) ? payload.bcc.map(e => ({ email: e })) : [{ email: payload.bcc }]) : undefined,
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
      tags: payload.category ? [payload.category] : undefined,
      headers: payload.messageIdempotencyKey ? { 'Idempotency-Key': payload.messageIdempotencyKey } : undefined,
    } as any;

    const result = await this.brevoApi.sendTransacEmail(sendSmtpEmail);
    return { provider: 'brevo' as ProviderName, messageId: result.response?.body?.messageId || result.messageId };
  }

  private async sendWithMailgun(payload: EmailPayload) {
    if (!config.MAILGUN_API_KEY || !config.MAILGUN_DOMAIN || !config.EMAIL_FROM) throw new Error('Mailgun not configured');
    const mg = new Mailgun(FormData);
    const client = mg.client({ username: 'api', key: config.MAILGUN_API_KEY });
    const result = await client.messages.create(config.MAILGUN_DOMAIN, {
      to: [payload.to],
      from: `${config.EMAIL_FROM_NAME || 'TheCalista'} <${config.EMAIL_FROM}>`,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      bcc: payload.bcc ? (Array.isArray(payload.bcc) ? payload.bcc.join(',') : payload.bcc) : undefined,
      'o:tag': payload.category ? [payload.category] : undefined,
      'h:Idempotency-Key': payload.messageIdempotencyKey,
    } as any);
    return { provider: 'mailgun' as ProviderName, messageId: (result as any).id };
  }

  private async sendWithSMTP(payload: EmailPayload) {
    if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) throw new Error('SMTP not configured');
    const port = config.SMTP_PORT;
    const transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: config.SMTP_USER!, pass: config.SMTP_PASS! },
    });

    // In development, verify SMTP connectivity/auth to surface errors early
    if (config.NODE_ENV !== 'production') {
      try {
        await transporter.verify();
        logger.info({ host: config.SMTP_HOST, port }, 'SMTP transporter verified');
      } catch (e: any) {
        logger.error({ host: config.SMTP_HOST, port, err: e?.message || e }, 'SMTP verify failed');
      }
    }

    const info = await transporter.sendMail({
      from: `${config.EMAIL_FROM_NAME || 'TheCalista'} <${config.EMAIL_FROM || config.SMTP_USER}>`,
      to: payload.to,
      bcc: payload.bcc,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      headers: payload.messageIdempotencyKey ? { 'Idempotency-Key': payload.messageIdempotencyKey } : undefined,
    });
    return { provider: 'smtp' as ProviderName, messageId: info.messageId };
  }

  private async tryProvider(name: ProviderName, payload: EmailPayload) {
    switch (name) {
      case 'sendgrid':
        return this.sendWithSendGrid(payload);
      case 'brevo':
        return this.sendWithBrevo(payload);
      case 'mailgun':
        return this.sendWithMailgun(payload);
      case 'smtp':
        return this.sendWithSMTP(payload);
      default:
        throw new Error(`Unknown provider: ${name}`);
    }
  }

  private jitter(ms: number) { return ms + Math.floor(Math.random() * 100); }

  async send(payload: EmailPayload) {
    const idempotency = payload.messageIdempotencyKey || crypto.randomUUID();
    const enriched = { ...payload, messageIdempotencyKey: idempotency };

    const enabledProviders = this.providers.filter(p => {
      if (p === 'sendgrid') return !!config.SENDGRID_API_KEY;
      if (p === 'brevo') return !!config.BREVO_API_KEY;
      if (p === 'mailgun') return !!(config.MAILGUN_API_KEY && config.MAILGUN_DOMAIN);
      if (p === 'smtp') return !!(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASS);
      return false;
    });

    // Verbose logging of provider plan and environment
    try {
      const priority = this.providers;
      const enabled = enabledProviders;
      logger.info({ priority, enabled, from: config.EMAIL_FROM, host: config.SMTP_HOST, port: config.SMTP_PORT }, 'Email provider selection');
    } catch {}

    if (enabledProviders.length === 0) {
      // As a last resort in dev, log the email so UX isn't blocked
      logger.warn({ to: payload.to, subject: payload.subject }, 'Email providers not configured. Logging email content.');
      logger.info({ html: payload.html, text: payload.text }, 'Email body');
      return { provider: 'none' as ProviderName, messageId: null };
    }

    const maxAttempts = enabledProviders.length;
    let lastError: any = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const provider = enabledProviders[attempt];
      try {
        const result = await this.tryProvider(provider, enriched);
        logger.info({ provider, messageId: result.messageId, to: payload.to, subject: payload.subject }, 'Email sent');
        return result;
      } catch (err: any) {
        lastError = err;
        logger.error({ provider, err: err?.message || err }, 'Email provider failed');
        if (attempt < maxAttempts - 1) {
          const backoff = this.jitter(250 * Math.pow(2, attempt));
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
      }
    }

    throw lastError || new Error('All email providers failed');
  }
}

export const emailService = new EmailService();