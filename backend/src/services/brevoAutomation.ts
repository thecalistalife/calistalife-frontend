// Enhanced Brevo Email Automation System
// Optimized for free tier usage with smart timing and segmentation

import { emailService } from './emailService';
import { brevo } from './brevoClient';
import { getEmailTemplate } from '@/templates/brevoEmailTemplates';
import { logger } from '@/utils/logger';
import type { CustomerData, ProductData, OrderData } from '@/templates/brevoEmailTemplates';

interface AutomationConfig {
  enabled: boolean;
  delayHours: number;
  maxAttempts: number;
  frequencyCapDays: number;
  segmentConditions?: {
    minOrderValue?: number;
    minOrderCount?: number;
    maxDaysSinceLastEmail?: number;
    preferredCategories?: string[];
    qualityTier?: 'premium' | 'standard';
  };
}

// Automation workflow configurations optimized for free tier
export const AUTOMATION_CONFIGS: Record<string, AutomationConfig> = {
  WELCOME_SERIES: {
    enabled: true,
    delayHours: 0.5, // Send within 30 minutes
    maxAttempts: 1,
    frequencyCapDays: 0, // Only once
  },
  ABANDONED_CART_1: {
    enabled: true,
    delayHours: 2, // 2 hours after abandonment
    maxAttempts: 1,
    frequencyCapDays: 1,
  },
  ABANDONED_CART_2: {
    enabled: true,
    delayHours: 24, // 1 day after first reminder
    maxAttempts: 1,
    frequencyCapDays: 3,
    segmentConditions: {
      minOrderValue: 50, // Only for carts over $50
    },
  },
  ORDER_CONFIRMATION: {
    enabled: true,
    delayHours: 0, // Immediate
    maxAttempts: 3,
    frequencyCapDays: 0,
  },
  CARE_GUIDE: {
    enabled: true,
    delayHours: 72, // 3 days after delivery
    maxAttempts: 1,
    frequencyCapDays: 30, // Once per month max
    segmentConditions: {
      minOrderValue: 75, // Only for premium orders
      qualityTier: 'premium',
    },
  },
  REVIEW_REQUEST: {
    enabled: true,
    delayHours: 168, // 1 week after delivery
    maxAttempts: 1,
    frequencyCapDays: 45, // Once every 45 days max
  },
  REENGAGEMENT_30: {
    enabled: true,
    delayHours: 720, // 30 days of inactivity
    maxAttempts: 1,
    frequencyCapDays: 30,
  },
  REENGAGEMENT_90: {
    enabled: true,
    delayHours: 2160, // 90 days of inactivity
    maxAttempts: 1,
    frequencyCapDays: 90,
    segmentConditions: {
      minOrderCount: 1, // Only for previous customers
    },
  },
};

interface EmailTracking {
  id: string;
  email: string;
  automationType: string;
  scheduledAt: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  lastError?: string;
  segmentMatch?: boolean;
  metadata?: Record<string, any>;
}

// In-memory tracking for automation emails (in production, use Redis or database)
const emailTrackingStore: Map<string, EmailTracking> = new Map();
const dailyUsageCounter = { date: '', count: 0 };

// Daily email usage tracking for free tier limit (300/day)
function trackDailyUsage(): boolean {
  const today = new Date().toISOString().split('T')[0];
  if (dailyUsageCounter.date !== today) {
    dailyUsageCounter.date = today;
    dailyUsageCounter.count = 0;
  }
  
  const FREE_TIER_DAILY_LIMIT = 300;
  if (dailyUsageCounter.count >= FREE_TIER_DAILY_LIMIT) {
    logger.warn(`Daily email limit reached: ${dailyUsageCounter.count}/${FREE_TIER_DAILY_LIMIT}`);
    return false;
  }
  
  dailyUsageCounter.count++;
  return true;
}

// Customer segmentation logic
function matchesSegmentConditions(customer: CustomerData, config: AutomationConfig): boolean {
  if (!config.segmentConditions) return true;
  
  const conditions = config.segmentConditions;
  
  // Check minimum order value
  if (conditions.minOrderValue && (!customer.totalSpent || customer.totalSpent < conditions.minOrderValue)) {
    return false;
  }
  
  // Check minimum order count
  if (conditions.minOrderCount && (!customer.orderCount || customer.orderCount < conditions.minOrderCount)) {
    return false;
  }
  
  // Check quality tier preference
  if (conditions.qualityTier === 'premium' && (!customer.qualityScore || customer.qualityScore < 4)) {
    return false;
  }
  
  // Check preferred categories
  if (conditions.preferredCategories && customer.preferredCategories) {
    const hasMatchingCategory = conditions.preferredCategories.some(cat => 
      customer.preferredCategories?.includes(cat)
    );
    if (!hasMatchingCategory) return false;
  }
  
  return true;
}

// Frequency capping to prevent spam
function isWithinFrequencyLimit(email: string, automationType: string, config: AutomationConfig): boolean {
  if (config.frequencyCapDays === 0) return true;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.frequencyCapDays);
  
  // Check if we've sent this type of email within the frequency cap period
  for (const [, tracking] of emailTrackingStore) {
    if (tracking.email === email && 
        tracking.automationType === automationType && 
        tracking.sentAt && 
        tracking.sentAt > cutoffDate) {
      return false;
    }
  }
  
  return true;
}

// Schedule automated email
export async function scheduleAutomationEmail(params: {
  automationType: keyof typeof AUTOMATION_CONFIGS;
  customer: CustomerData;
  data?: any; // Order, cart items, etc.
  priority?: 'high' | 'medium' | 'low';
}): Promise<{ success: boolean; trackingId?: string; reason?: string }> {
  const { automationType, customer, data, priority = 'medium' } = params;
  const config = AUTOMATION_CONFIGS[automationType];
  
  if (!config?.enabled) {
    return { success: false, reason: 'Automation disabled' };
  }
  
  // Check segmentation
  const segmentMatch = matchesSegmentConditions(customer, config);
  if (!segmentMatch) {
    return { success: false, reason: 'Customer does not match segment conditions' };
  }
  
  // Check frequency limits
  if (!isWithinFrequencyLimit(customer.email, automationType, config)) {
    return { success: false, reason: 'Frequency cap exceeded' };
  }
  
  // Generate tracking ID
  const trackingId = `${automationType}_${customer.email}_${Date.now()}`;
  
  // Calculate scheduled time
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + config.delayHours);
  
  // Store tracking info
  const tracking: EmailTracking = {
    id: trackingId,
    email: customer.email,
    automationType,
    scheduledAt,
    status: 'pending',
    attempts: 0,
    segmentMatch: true,
    metadata: { customer, data, priority },
  };
  
  emailTrackingStore.set(trackingId, tracking);
  
  // For immediate sends (like order confirmations), send now
  if (config.delayHours === 0) {
    await processScheduledEmail(trackingId);
  }
  
  logger.info({
    trackingId,
    automationType,
    email: customer.email,
    scheduledAt: scheduledAt.toISOString(),
    delayHours: config.delayHours
  }, 'Email automation scheduled');
  
  return { success: true, trackingId };
}

// Process a scheduled email
async function processScheduledEmail(trackingId: string): Promise<boolean> {
  const tracking = emailTrackingStore.get(trackingId);
  if (!tracking || tracking.status !== 'pending') {
    return false;
  }
  
  const config = AUTOMATION_CONFIGS[tracking.automationType as keyof typeof AUTOMATION_CONFIGS];
  if (!config) return false;
  
  // Check if it's time to send
  if (new Date() < tracking.scheduledAt) {
    return false;
  }
  
  // Check daily usage limit
  if (!trackDailyUsage()) {
    // Reschedule for tomorrow
    tracking.scheduledAt = new Date();
    tracking.scheduledAt.setDate(tracking.scheduledAt.getDate() + 1);
    tracking.scheduledAt.setHours(9, 0, 0, 0); // 9 AM tomorrow
    return false;
  }
  
  try {
    // Generate email content
    const emailData = getEmailTemplate(tracking.automationType as any, tracking.metadata);
    
    // Send via email service
    const result = await emailService.send({
      to: tracking.email,
      subject: emailData.subject,
      html: emailData.html,
      category: `automation-${tracking.automationType.toLowerCase()}`,
    });
    
    // Update tracking
    tracking.status = 'sent';
    tracking.sentAt = new Date();
    tracking.attempts++;
    
    // Update customer contact in Brevo for better segmentation
    await updateBrevoContact(tracking.metadata?.customer, tracking.automationType);
    
    logger.info({
      trackingId,
      automationType: tracking.automationType,
      email: tracking.email,
      provider: result.provider,
      messageId: result.messageId
    }, 'Automation email sent successfully');
    
    return true;
  } catch (error: any) {
    tracking.attempts++;
    tracking.lastError = error.message;
    
    // Retry logic
    if (tracking.attempts < config.maxAttempts) {
      // Exponential backoff: retry in 1, 2, 4 hours
      const retryDelayHours = Math.pow(2, tracking.attempts - 1);
      tracking.scheduledAt = new Date();
      tracking.scheduledAt.setHours(tracking.scheduledAt.getHours() + retryDelayHours);
      tracking.status = 'pending';
      
      logger.warn({
        trackingId,
        attempts: tracking.attempts,
        maxAttempts: config.maxAttempts,
        retryIn: retryDelayHours,
        error: error.message
      }, 'Automation email failed, scheduling retry');
    } else {
      tracking.status = 'failed';
      logger.error({
        trackingId,
        automationType: tracking.automationType,
        email: tracking.email,
        error: error.message,
        attempts: tracking.attempts
      }, 'Automation email failed permanently');
    }
    
    return false;
  }
}

// Update Brevo contact with automation engagement data
async function updateBrevoContact(customer: CustomerData, automationType: string): Promise<void> {
  if (!customer?.email) return;
  
  try {
    const updateData: any = {
      attributes: {
        LAST_EMAIL_TYPE: automationType,
        LAST_EMAIL_DATE: new Date().toISOString(),
        EMAIL_ENGAGEMENT_SCORE: (customer.qualityScore || 0) + 1, // Increment engagement
      },
    };
    
    // Add to specific lists based on automation type
    const listMapping: Record<string, number[]> = {
      WELCOME_SERIES: [1], // Welcome list
      ABANDONED_CART_1: [2], // Cart recovery list
      ABANDONED_CART_2: [2],
      REENGAGEMENT_30: [3], // Re-engagement list
      REENGAGEMENT_90: [3],
    };
    
    if (listMapping[automationType]) {
      updateData.listIds = listMapping[automationType];
    }
    
    await brevo.contacts.updateContact(customer.email, updateData);
  } catch (error) {
    // Best effort - don't fail the email send if contact update fails
    logger.warn({ email: customer.email, automationType, error }, 'Failed to update Brevo contact');
  }
}

// Process all scheduled emails (called by cron job or scheduler)
export async function processScheduledEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}> {
  const now = new Date();
  let processed = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const [trackingId, tracking] of emailTrackingStore) {
    if (tracking.status === 'pending' && tracking.scheduledAt <= now) {
      processed++;
      const success = await processScheduledEmail(trackingId);
      if (success) {
        sent++;
      } else if (tracking.status === 'failed') {
        failed++;
      } else {
        skipped++; // Rescheduled or rate limited
      }
    }
  }
  
  logger.info({ processed, sent, failed, skipped }, 'Scheduled email processing completed');
  return { processed, sent, failed, skipped };
}

// Convenience functions for common automation triggers

export async function triggerWelcomeEmail(customer: CustomerData) {
  return scheduleAutomationEmail({
    automationType: 'WELCOME_SERIES',
    customer,
    priority: 'high',
  });
}

export async function triggerAbandonedCartEmail(customer: CustomerData, cartItems: ProductData[], stage: 1 | 2 = 1) {
  const automationType = stage === 1 ? 'ABANDONED_CART_1' : 'ABANDONED_CART_2';
  return scheduleAutomationEmail({
    automationType,
    customer,
    data: { cartItems },
    priority: 'medium',
  });
}

export async function triggerOrderConfirmationEmail(customer: CustomerData, order: OrderData) {
  return scheduleAutomationEmail({
    automationType: 'ORDER_CONFIRMATION',
    customer,
    data: { order },
    priority: 'high',
  });
}

export async function triggerCareGuideEmail(customer: CustomerData, order: OrderData) {
  return scheduleAutomationEmail({
    automationType: 'CARE_GUIDE',
    customer,
    data: { order },
    priority: 'low',
  });
}

export async function triggerReviewRequestEmail(customer: CustomerData, order: OrderData) {
  return scheduleAutomationEmail({
    automationType: 'REVIEW_REQUEST',
    customer,
    data: { order },
    priority: 'medium',
  });
}

export async function triggerReengagementEmail(customer: CustomerData, daysSinceLastPurchase: number) {
  const automationType = daysSinceLastPurchase >= 90 ? 'REENGAGEMENT_90' : 'REENGAGEMENT_30';
  return scheduleAutomationEmail({
    automationType,
    customer,
    priority: 'low',
  });
}

// Analytics and reporting
export function getAutomationStats(): {
  dailyUsage: { date: string; count: number };
  pendingEmails: number;
  totalScheduled: number;
  successRate: number;
  automationBreakdown: Record<string, { scheduled: number; sent: number; failed: number }>;
} {
  const stats = {
    dailyUsage: { ...dailyUsageCounter },
    pendingEmails: 0,
    totalScheduled: emailTrackingStore.size,
    successRate: 0,
    automationBreakdown: {} as Record<string, { scheduled: number; sent: number; failed: number }>,
  };
  
  let totalSent = 0;
  let totalAttempted = 0;
  
  for (const [, tracking] of emailTrackingStore) {
    if (tracking.status === 'pending') stats.pendingEmails++;
    if (tracking.status === 'sent') totalSent++;
    if (tracking.status !== 'pending') totalAttempted++;
    
    // Automation breakdown
    if (!stats.automationBreakdown[tracking.automationType]) {
      stats.automationBreakdown[tracking.automationType] = { scheduled: 0, sent: 0, failed: 0 };
    }
    
    const breakdown = stats.automationBreakdown[tracking.automationType];
    breakdown.scheduled++;
    if (tracking.status === 'sent') breakdown.sent++;
    if (tracking.status === 'failed') breakdown.failed++;
  }
  
  stats.successRate = totalAttempted > 0 ? (totalSent / totalAttempted) * 100 : 0;
  
  return stats;
}

// Cleanup old tracking records (run daily)
export function cleanupOldTrackingRecords(daysToKeep: number = 30): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  let removed = 0;
  for (const [trackingId, tracking] of emailTrackingStore) {
    if (tracking.scheduledAt < cutoffDate && tracking.status !== 'pending') {
      emailTrackingStore.delete(trackingId);
      removed++;
    }
  }
  
  logger.info({ removed, remaining: emailTrackingStore.size }, 'Cleaned up old email tracking records');
  return removed;
}