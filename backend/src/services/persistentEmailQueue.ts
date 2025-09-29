import { supabaseAdmin } from '@/utils/supabase';
import { logger } from '@/utils/logger';

type QueuedEmail = {
  id?: string;
  order_number: string;
  email_type: string;
  recipient_email: string;
  scheduled_at: string;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  attempts: number;
  last_attempt_at?: string;
  error_message?: string;
  metadata?: any;
};

class PersistentEmailQueue {
  private processingInterval?: NodeJS.Timeout;

  async init() {
    // Create email_queue table if it doesn't exist
    try {
      await supabaseAdmin.rpc('create_email_queue_table');
    } catch (e) {
      // Table likely exists; continue
      logger.info('Email queue table already exists or error creating it');
    }
    
    // Start processing every 30 seconds
    this.processingInterval = setInterval(() => this.processQueue(), 30000);
    logger.info('PersistentEmailQueue initialized');
  }

  async schedule(orderNumber: string, emailType: string, recipientEmail: string, scheduledAt: Date, metadata?: any) {
    const job: QueuedEmail = {
      order_number: orderNumber,
      email_type: emailType,
      recipient_email: recipientEmail,
      scheduled_at: scheduledAt.toISOString(),
      status: 'pending',
      attempts: 0,
      metadata,
    };

    const { error } = await supabaseAdmin.from('email_queue').insert(job);
    if (error) {
      logger.error({ err: error, job }, 'Failed to schedule email job');
      throw error;
    }
    
    logger.info({ orderNumber, emailType, scheduledAt }, 'Email job scheduled');
  }

  async processQueue() {
    const now = new Date().toISOString();
    const { data: jobs, error } = await supabaseAdmin
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .lt('attempts', 3)
      .limit(10);

    if (error) {
      logger.error({ err: error }, 'Failed to fetch email queue jobs');
      return;
    }

    for (const job of jobs || []) {
      await this.processJob(job);
    }
  }

  private async processJob(job: QueuedEmail) {
    // Mark as processing
    await supabaseAdmin
      .from('email_queue')
      .update({ status: 'processing', last_attempt_at: new Date().toISOString() })
      .eq('id', job.id);

    try {
      // Get order data
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', job.order_number)
        .single();

      if (!order) {
        throw new Error(`Order ${job.order_number} not found`);
      }

      // Import and send email
      const { sendOrderEmail } = await import('./orderEmailService');
      await sendOrderEmail(job.email_type as any, { order, ...job.metadata });

      // Mark as sent
      await supabaseAdmin
        .from('email_queue')
        .update({ status: 'sent' })
        .eq('id', job.id);

      logger.info({ jobId: job.id, orderNumber: job.order_number, emailType: job.email_type }, 'Email job completed');
    } catch (error: any) {
      const attempts = job.attempts + 1;
      const status = attempts >= 3 ? 'failed' : 'pending';
      
      await supabaseAdmin
        .from('email_queue')
        .update({ 
          status, 
          attempts, 
          error_message: error.message,
          last_attempt_at: new Date().toISOString() 
        })
        .eq('id', job.id);

      logger.error({ err: error, jobId: job.id, attempts }, 'Email job failed');
    }
  }

  async cancel(orderNumber: string, emailType: string) {
    await supabaseAdmin
      .from('email_queue')
      .delete()
      .eq('order_number', orderNumber)
      .eq('email_type', emailType)
      .eq('status', 'pending');
    
    logger.info({ orderNumber, emailType }, 'Email job cancelled');
  }

  cleanup() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      logger.info('PersistentEmailQueue cleanup completed');
    }
  }
}

export const persistentEmailQueue = new PersistentEmailQueue();