import 'dotenv/config';
import { emailService } from '@/services/emailService';

async function main() {
  const toArg = process.argv.find((a) => a.startsWith('--to='));
  const to = toArg ? toArg.split('=')[1] : process.env.TEST_EMAIL;
  if (!to) {
    console.error('Usage: ts-node -r tsconfig-paths/register src/scripts/testEmail.ts --to=recipient@example.com');
    process.exit(1);
  }
  const subject = 'TheCalista: Test email';
  const html = '<p>This is a test email from TheCalista backend.</p>';
  try {
    const res = await emailService.send({ to, subject, html, category: 'test' });
    console.log('Email sent OK via provider:', (res as any).provider, 'messageId:', (res as any).messageId);
  } catch (e: any) {
    console.error('Email send failed:', e?.message || e);
    process.exit(2);
  }
}

main().catch((e) => { console.error(e); process.exit(2); });