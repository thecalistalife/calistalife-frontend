import { emailService } from '@/services/emailService';

export interface SendMailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  category?: string; // for provider tagging
  messageIdempotencyKey?: string; // to de-dupe retries
}

export const sendMail = async (opts: SendMailOptions) => {
  return emailService.send(opts);
};
