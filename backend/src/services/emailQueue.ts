import { logger } from '@/utils/logger';

// Simple in-memory delayed email task runner for dev/first deployment
// In production, back this by a persistent store (e.g. Supabase table + cron worker)

type Task = { id: string; runAt: number; fn: () => Promise<void> | void };

class EmailQueue {
  private tasks = new Map<string, NodeJS.Timeout>();

  schedule(id: string, when: Date, fn: () => Promise<void> | void) {
    const delay = Math.max(0, when.getTime() - Date.now());
    if (this.tasks.has(id)) this.cancel(id);
    const timer = setTimeout(async () => {
      try { await fn(); } catch (e) { logger.error({ err: e, id }, 'EmailQueue task failed'); }
      finally { this.tasks.delete(id); }
    }, delay);
    this.tasks.set(id, timer);
    logger.info({ id, delay }, 'EmailQueue scheduled');
  }

  cancel(id: string) {
    const t = this.tasks.get(id);
    if (t) { clearTimeout(t); this.tasks.delete(id); logger.info({ id }, 'EmailQueue cancelled'); }
  }
}

export const emailQueue = new EmailQueue();