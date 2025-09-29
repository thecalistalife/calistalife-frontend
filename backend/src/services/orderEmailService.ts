import { emailService } from '@/services/emailService';
import { renderOrderConfirmation, renderProcessing, renderShipped, renderOutForDelivery, renderDelivered, renderFollowUp } from '@/templates/orderEmails';
import { OrderStatus, statusEmailSubject } from '@/utils/order';
import { config } from '@/utils/config';

export async function sendOrderEmail(type: OrderStatus | 'confirmation' | 'follow_up', params: { order: any; items?: any[]; trackingNumber?: string; courier?: string; trackUrl?: string; estDelivery?: string; windowText?: string; }) {
  const { order } = params;
  const to = (order?.shipping_address?.email || order?.billing_address?.email || order?.customer_email) as string | undefined;
  if (!to) return;
  const logoUrl = process.env.BRAND_LOGO_URL || `${config.CLIENT_URL.replace(/\/$/,'')}/logo.svg`;
  let html = '';
  let subject = '';
  const defaultTrackUrl = `${config.CLIENT_URL.replace(/\/$/,'')}/orders`;
  switch (type) {
    case 'confirmation':
    case 'confirmed':
html = renderOrderConfirmation({ order, items: params.items || [], logoUrl, trackUrl: params.trackUrl || defaultTrackUrl, estDelivery: params.estDelivery });
      subject = statusEmailSubject('confirmed', order.order_number);
      break;
    case 'processing':
      html = renderProcessing({ order, timelineNote: 'We typically ship within 24 hours.', logoUrl });
      subject = statusEmailSubject('processing', order.order_number);
      break;
    case 'shipped':
html = renderShipped({ order, trackingNumber: params.trackingNumber, courier: params.courier, logoUrl, trackUrl: params.trackUrl || defaultTrackUrl, estDelivery: params.estDelivery });
      subject = statusEmailSubject('shipped', order.order_number);
      break;
    case 'out_for_delivery':
      html = renderOutForDelivery({ order, windowText: params.windowText, logoUrl });
      subject = statusEmailSubject('out_for_delivery', order.order_number);
      break;
    case 'delivered':
      html = renderDelivered({ order, logoUrl });
      subject = statusEmailSubject('delivered', order.order_number);
      break;
    case 'follow_up':
      html = renderFollowUp({ order, logoUrl });
      subject = 'How was your CalistaLife experience?';
      break;
    default:
      return;
  }

  const bccList = (process.env.ORDER_EMAIL_BCC || config.ORDER_EMAIL_BCC || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  await emailService.send({ to, subject, html, category: `order-${type}`, bcc: bccList.length ? bccList : undefined });
}