// Brevo Deliverability Monitoring & Engagement Tracking System
// Comprehensive monitoring for email performance and deliverability

import { brevo } from './brevoClient';
import { logger } from '@/utils/logger';
import { config } from '@/utils/config';

interface DeliverabilityStats {
  sent: number;
  delivered: number;
  bounced: number;
  spam: number;
  unsubscribed: number;
  opened: number;
  clicked: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  spamRate: number;
  unsubscribeRate: number;
}

interface WebhookEvent {
  event: string;
  email: string;
  messageId: string;
  timestamp: string;
  reason?: string;
  tags?: string[];
  subject?: string;
}

interface ContactHealth {
  email: string;
  status: 'active' | 'bounced' | 'unsubscribed' | 'spam' | 'inactive';
  bounceCount: number;
  spamComplaintCount: number;
  lastEmailSent?: Date;
  lastEngagement?: Date;
  engagementScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// In-memory storage for monitoring (in production, use database)
const deliverabilityMetrics: Map<string, DeliverabilityStats> = new Map();
const contactHealthMap: Map<string, ContactHealth> = new Map();
const suppressionList: Set<string> = new Set();
const alertThresholds = {
  bounceRate: 5, // Alert if bounce rate > 5%
  spamRate: 0.1, // Alert if spam rate > 0.1%
  deliveryRate: 95, // Alert if delivery rate < 95%
  dailyVolumeSpike: 2.0, // Alert if daily volume > 2x average
};

// Webhook handler for Brevo events
export async function handleBrevoWebhook(eventData: WebhookEvent[]): Promise<{ processed: number; alerts: string[] }> {
  const alerts: string[] = [];
  let processed = 0;

  for (const event of eventData) {
    try {
      await processWebhookEvent(event);
      processed++;

      // Check for immediate alerts
      const alert = checkEventForAlert(event);
      if (alert) {
        alerts.push(alert);
      }
    } catch (error) {
      logger.error({ event, error }, 'Failed to process webhook event');
    }
  }

  // Update deliverability metrics after processing all events
  await updateDeliverabilityMetrics();

  logger.info({ processed, alerts: alerts.length }, 'Processed Brevo webhook events');
  return { processed, alerts };
}

// Process individual webhook event
async function processWebhookEvent(event: WebhookEvent): Promise<void> {
  const { email, event: eventType, messageId, timestamp, reason, tags } = event;

  // Update contact health
  let contactHealth = contactHealthMap.get(email);
  if (!contactHealth) {
    contactHealth = {
      email,
      status: 'active',
      bounceCount: 0,
      spamComplaintCount: 0,
      engagementScore: 0,
      riskLevel: 'low',
    };
    contactHealthMap.set(email, contactHealth);
  }

  switch (eventType) {
    case 'delivered':
      contactHealth.lastEmailSent = new Date(timestamp);
      break;

    case 'opened':
      contactHealth.lastEngagement = new Date(timestamp);
      contactHealth.engagementScore += 1;
      break;

    case 'clicked':
      contactHealth.lastEngagement = new Date(timestamp);
      contactHealth.engagementScore += 2;
      break;

    case 'bounced':
      contactHealth.bounceCount++;
      contactHealth.status = 'bounced';
      
      // Add to suppression list after multiple bounces
      if (contactHealth.bounceCount >= 2) {
        suppressionList.add(email);
        contactHealth.riskLevel = 'high';
        logger.warn({ email, bounceCount: contactHealth.bounceCount, reason }, 'Email added to suppression list (multiple bounces)');
      }
      break;

    case 'spam':
      contactHealth.spamComplaintCount++;
      contactHealth.status = 'spam';
      contactHealth.riskLevel = 'high';
      
      // Immediately suppress spam complaints
      suppressionList.add(email);
      logger.error({ email, reason }, 'Email added to suppression list (spam complaint)');
      break;

    case 'unsubscribed':
      contactHealth.status = 'unsubscribed';
      suppressionList.add(email);
      break;

    case 'blocked':
      contactHealth.riskLevel = 'high';
      logger.warn({ email, reason }, 'Email delivery blocked');
      break;
  }

  // Update risk level based on activity
  updateContactRiskLevel(contactHealth);

  // Log significant events
  if (['bounced', 'spam', 'blocked'].includes(eventType)) {
    logger.warn({
      email,
      event: eventType,
      messageId,
      reason,
      tags,
      contactStatus: contactHealth.status,
      riskLevel: contactHealth.riskLevel
    }, 'Deliverability issue detected');
  }
}

// Update contact risk level based on engagement patterns
function updateContactRiskLevel(contact: ContactHealth): void {
  const daysSinceLastEngagement = contact.lastEngagement 
    ? (Date.now() - contact.lastEngagement.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  if (contact.bounceCount >= 2 || contact.spamComplaintCount >= 1) {
    contact.riskLevel = 'high';
  } else if (daysSinceLastEngagement > 90 || contact.bounceCount === 1) {
    contact.riskLevel = 'medium';
  } else if (contact.engagementScore > 5 && daysSinceLastEngagement < 30) {
    contact.riskLevel = 'low';
  }

  // Update status based on engagement
  if (contact.status === 'active' && daysSinceLastEngagement > 180) {
    contact.status = 'inactive';
  }
}

// Check event for immediate alerts
function checkEventForAlert(event: WebhookEvent): string | null {
  const { event: eventType, email, reason } = event;

  switch (eventType) {
    case 'spam':
      return `🚨 SPAM COMPLAINT: ${email} marked email as spam. Reason: ${reason || 'Unknown'}`;
    
    case 'bounced':
      const contact = contactHealthMap.get(email);
      if (contact && contact.bounceCount >= 2) {
        return `⚠️ MULTIPLE BOUNCES: ${email} has bounced ${contact.bounceCount} times`;
      }
      break;
    
    case 'blocked':
      return `🚫 DELIVERY BLOCKED: ${email} - ${reason || 'Unknown reason'}`;
  }

  return null;
}

// Update deliverability metrics from recent events
async function updateDeliverabilityMetrics(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  
  if (!deliverabilityMetrics.has(today)) {
    deliverabilityMetrics.set(today, {
      sent: 0,
      delivered: 0,
      bounced: 0,
      spam: 0,
      unsubscribed: 0,
      opened: 0,
      clicked: 0,
      deliveryRate: 0,
      openRate: 0,
      clickRate: 0,
      bounceRate: 0,
      spamRate: 0,
      unsubscribeRate: 0,
    });
  }

  // In a real implementation, you'd calculate these from the webhook events
  // For now, we'll update the structure to track events
  const todayStats = deliverabilityMetrics.get(today)!;
  
  // Calculate rates
  if (todayStats.sent > 0) {
    todayStats.deliveryRate = (todayStats.delivered / todayStats.sent) * 100;
    todayStats.bounceRate = (todayStats.bounced / todayStats.sent) * 100;
    todayStats.spamRate = (todayStats.spam / todayStats.sent) * 100;
    todayStats.unsubscribeRate = (todayStats.unsubscribed / todayStats.sent) * 100;
  }

  if (todayStats.delivered > 0) {
    todayStats.openRate = (todayStats.opened / todayStats.delivered) * 100;
    todayStats.clickRate = (todayStats.clicked / todayStats.delivered) * 100;
  }
}

// Get current deliverability stats
export function getDeliverabilityStats(days: number = 7): {
  current: DeliverabilityStats;
  trend: DeliverabilityStats[];
  alerts: string[];
} {
  const alerts: string[] = [];
  const trend: DeliverabilityStats[] = [];
  let totalStats: DeliverabilityStats = {
    sent: 0,
    delivered: 0,
    bounced: 0,
    spam: 0,
    unsubscribed: 0,
    opened: 0,
    clicked: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
    spamRate: 0,
    unsubscribeRate: 0,
  };

  // Calculate stats for the last N days
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayStats = deliverabilityMetrics.get(dateStr);
    if (dayStats) {
      trend.unshift({ ...dayStats });
      
      // Accumulate totals
      totalStats.sent += dayStats.sent;
      totalStats.delivered += dayStats.delivered;
      totalStats.bounced += dayStats.bounced;
      totalStats.spam += dayStats.spam;
      totalStats.unsubscribed += dayStats.unsubscribed;
      totalStats.opened += dayStats.opened;
      totalStats.clicked += dayStats.clicked;
    }
  }

  // Calculate overall rates
  if (totalStats.sent > 0) {
    totalStats.deliveryRate = (totalStats.delivered / totalStats.sent) * 100;
    totalStats.bounceRate = (totalStats.bounced / totalStats.sent) * 100;
    totalStats.spamRate = (totalStats.spam / totalStats.sent) * 100;
    totalStats.unsubscribeRate = (totalStats.unsubscribed / totalStats.sent) * 100;
  }

  if (totalStats.delivered > 0) {
    totalStats.openRate = (totalStats.opened / totalStats.delivered) * 100;
    totalStats.clickRate = (totalStats.clicked / totalStats.delivered) * 100;
  }

  // Check for alerts
  if (totalStats.bounceRate > alertThresholds.bounceRate) {
    alerts.push(`High bounce rate: ${totalStats.bounceRate.toFixed(2)}% (threshold: ${alertThresholds.bounceRate}%)`);
  }

  if (totalStats.spamRate > alertThresholds.spamRate) {
    alerts.push(`High spam rate: ${totalStats.spamRate.toFixed(2)}% (threshold: ${alertThresholds.spamRate}%)`);
  }

  if (totalStats.deliveryRate < alertThresholds.deliveryRate) {
    alerts.push(`Low delivery rate: ${totalStats.deliveryRate.toFixed(2)}% (threshold: ${alertThresholds.deliveryRate}%)`);
  }

  return {
    current: totalStats,
    trend,
    alerts,
  };
}

// Get contact health report
export function getContactHealthReport(): {
  totalContacts: number;
  healthyContacts: number;
  suppressedContacts: number;
  riskyContacts: number;
  inactiveContacts: number;
  topRiskContacts: ContactHealth[];
} {
  const report = {
    totalContacts: contactHealthMap.size,
    healthyContacts: 0,
    suppressedContacts: suppressionList.size,
    riskyContacts: 0,
    inactiveContacts: 0,
    topRiskContacts: [] as ContactHealth[],
  };

  const riskContacts: ContactHealth[] = [];

  for (const [, contact] of contactHealthMap) {
    switch (contact.riskLevel) {
      case 'low':
        report.healthyContacts++;
        break;
      case 'medium':
      case 'high':
        report.riskyContacts++;
        riskContacts.push(contact);
        break;
    }

    if (contact.status === 'inactive') {
      report.inactiveContacts++;
    }
  }

  // Sort by risk level and bounce count
  report.topRiskContacts = riskContacts
    .sort((a, b) => {
      if (a.riskLevel !== b.riskLevel) {
        return a.riskLevel === 'high' ? -1 : 1;
      }
      return b.bounceCount - a.bounceCount;
    })
    .slice(0, 10);

  return report;
}

// Check if email is suppressed
export function isEmailSuppressed(email: string): boolean {
  return suppressionList.has(email.toLowerCase());
}

// Remove email from suppression list (for manual intervention)
export function removeFromSuppressionList(email: string): boolean {
  const removed = suppressionList.delete(email.toLowerCase());
  if (removed) {
    const contact = contactHealthMap.get(email);
    if (contact) {
      contact.status = 'active';
      contact.riskLevel = 'medium';
    }
    logger.info({ email }, 'Email removed from suppression list manually');
  }
  return removed;
}

// Clean inactive contacts for free tier optimization
export async function cleanInactiveContacts(daysInactive: number = 180): Promise<{
  identified: number;
  cleaned: number;
  errors: number;
}> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

  const inactiveContacts: string[] = [];

  // Identify inactive contacts
  for (const [email, contact] of contactHealthMap) {
    const lastActivity = contact.lastEngagement || contact.lastEmailSent;
    if (!lastActivity || lastActivity < cutoffDate) {
      if (contact.status === 'active' && contact.engagementScore < 2) {
        inactiveContacts.push(email);
      }
    }
  }

  let cleaned = 0;
  let errors = 0;

  // Clean inactive contacts from Brevo (move to inactive list or delete)
  for (const email of inactiveContacts) {
    try {
      // In production, you might want to move to an inactive list instead of deleting
      const inactiveListId = parseInt(process.env.BREVO_LIST_INACTIVE || '99', 10);
      
      await brevo.contacts.updateContact(email, {
        listIds: [inactiveListId],
        unlinkListIds: [1, 2, 3], // Remove from active lists
        attributes: {
          STATUS: 'INACTIVE',
          CLEANED_DATE: new Date().toISOString(),
        },
      });

      // Update local contact health
      const contact = contactHealthMap.get(email);
      if (contact) {
        contact.status = 'inactive';
      }

      cleaned++;
    } catch (error) {
      errors++;
      logger.error({ email, error }, 'Failed to clean inactive contact');
    }
  }

  logger.info({
    identified: inactiveContacts.length,
    cleaned,
    errors,
    daysInactive
  }, 'Inactive contact cleanup completed');

  return { identified: inactiveContacts.length, cleaned, errors };
}

// Daily monitoring report
export async function generateDailyReport(): Promise<{
  deliverability: ReturnType<typeof getDeliverabilityStats>;
  contactHealth: ReturnType<typeof getContactHealthReport>;
  recommendations: string[];
}> {
  const deliverability = getDeliverabilityStats(1); // Last 24 hours
  const contactHealth = getContactHealthReport();

  const recommendations: string[] = [];

  // Generate recommendations based on metrics
  if (deliverability.current.bounceRate > 3) {
    recommendations.push('High bounce rate detected. Review and clean your contact list.');
  }

  if (deliverability.current.openRate < 15) {
    recommendations.push('Low open rate. Consider improving subject lines and send timing.');
  }

  if (contactHealth.suppressedContacts > contactHealth.totalContacts * 0.05) {
    recommendations.push('High suppression rate. Review email content and frequency.');
  }

  if (contactHealth.inactiveContacts > contactHealth.totalContacts * 0.3) {
    recommendations.push('Many inactive contacts. Run cleanup to improve deliverability.');
  }

  const report = {
    deliverability,
    contactHealth,
    recommendations,
  };

  // Log daily summary
  logger.info({
    date: new Date().toISOString().split('T')[0],
    sent: deliverability.current.sent,
    deliveryRate: deliverability.current.deliveryRate.toFixed(2),
    openRate: deliverability.current.openRate.toFixed(2),
    bounceRate: deliverability.current.bounceRate.toFixed(2),
    suppressedContacts: contactHealth.suppressedContacts,
    alerts: deliverability.alerts.length,
  }, 'Daily email monitoring report');

  return report;
}

// Initialize webhook endpoints for Brevo events
export function setupWebhookEndpoints(app: any): void {
  app.post('/webhooks/brevo', async (req: any, res: any) => {
    try {
      const events = req.body;
      const result = await handleBrevoWebhook(events);
      
      res.json({
        success: true,
        processed: result.processed,
        alerts: result.alerts,
      });
    } catch (error) {
      logger.error({ error }, 'Webhook processing failed');
      res.status(500).json({ success: false, error: 'Webhook processing failed' });
    }
  });

  // Health check endpoint
  app.get('/monitoring/email-health', (req: any, res: any) => {
    const stats = getDeliverabilityStats(7);
    const health = getContactHealthReport();
    
    res.json({
      deliverability: stats,
      contacts: health,
      suppressionList: suppressionList.size,
    });
  });
}