import nodemailer from 'nodemailer';

interface SendMailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export const sendMail = async ({ to, subject, html, text }: SendMailOptions) => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.EMAIL_FROM || user || 'no-reply@thecalista.com';

  if (!host || !user || !pass) {
    // Fallback: log emails in development
    console.log('Email (dev fallback):', { to, subject, html, text });
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: { user, pass }
  });

  await transporter.sendMail({ from, to, subject, html, text });
};