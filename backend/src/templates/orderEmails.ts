import { ORDER_STATUS_LABEL, OrderStatus } from '@/utils/order';

const styles = {
  wrapper: 'margin:0;padding:0;background:#f6f8fa;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111',
  container: 'max-width:640px;margin:0 auto;padding:24px',
  card: 'background:#ffffff;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,0.06);padding:24px',
  h1: 'font-size:22px;margin:0 0 12px;color:#111',
  p: 'font-size:14px;line-height:1.6;margin:0 0 10px;color:#333',
  small: 'color:#6b7280;font-size:12px',
  table: 'width:100%;border-collapse:collapse;margin-top:12px',
  th: 'text-align:left;border-bottom:1px solid #e5e7eb;padding:8px;font-size:13px;color:#374151',
  td: 'border-bottom:1px solid #f3f4f6;padding:8px;font-size:13px;color:#111;vertical-align:top',
  img: 'width:56px;height:56px;border-radius:6px;object-fit:cover;border:1px solid #eee',
  btn: 'display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600',
  outlineBtn: 'display:inline-block;background:#fff;color:#111;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600;border:1px solid #111',
  footer: 'margin-top:24px;border-top:1px solid #e5e7eb;padding-top:12px;color:#6b7280;font-size:12px',
};

function headerHtml(logoUrl?: string) {
  return `<div style="text-align:center;margin-bottom:16px">${logoUrl ? `<img src="${logoUrl}" alt="CalistaLife" style="height:40px"/>` : `<div style=\"font-size:24px;font-weight:800;color:#e11d48\">CalistaLife</div>`}</div>`;
}

function addressesHtml(order: any) {
  const ship = order?.shipping_address || {};
  const bill = order?.billing_address || ship || {};
  const block = (a: any) => [a.name, a.address1, a.address2, `${a.city || ''} ${a.state || ''} ${a.zip || ''}`, a.country, a.phone].filter(Boolean).join('<br/>');
  return `<table style="${styles.table}"><tr><th style="${styles.th}">Shipping Address</th><th style="${styles.th}">Billing Address</th></tr><tr><td style="${styles.td}">${block(ship)}</td><td style="${styles.td}">${block(bill)}</td></tr></table>`;
}

function itemsHtml(items: any[]) {
  const rows = items.map((it) => `<tr>
    <td style="${styles.td}"><img src="${it.image}" alt="${it.name}" style="${styles.img}"/></td>
    <td style="${styles.td}">
      <div style="font-weight:600">${it.name}</div>
      <div style="${styles.small}">Size: ${it.size || '-'} • Color: ${it.color || '-'}</div>
    </td>
    <td style="${styles.td}">x${it.quantity}</td>
    <td style="${styles.td}">₹${(it.price || 0).toFixed(2)}</td>
  </tr>`).join('');
  return `<table style="${styles.table}">
    <tr><th style="${styles.th}">Item</th><th style="${styles.th}">Details</th><th style="${styles.th}">Qty</th><th style="${styles.th}">Price</th></tr>
    ${rows}
  </table>`;
}

function totalsHtml(order: any) {
  const subtotal = order.subtotal ?? 0;
  const shipping = order.shipping_cost ?? 0;
  const tax = order.tax ?? 0;
  const total = order.total_amount ?? (subtotal + shipping + tax);
  return `<table style="${styles.table}">
    <tr><td style="${styles.td}">Subtotal</td><td style="${styles.td};text-align:right">₹${subtotal.toFixed(2)}</td></tr>
    <tr><td style="${styles.td}">Shipping</td><td style="${styles.td};text-align:right">₹${shipping.toFixed(2)}</td></tr>
    <tr><td style="${styles.td}">Tax</td><td style="${styles.td};text-align:right">₹${tax.toFixed(2)}</td></tr>
    <tr><td style="${styles.td};font-weight:700">Total</td><td style="${styles.td};text-align:right;font-weight:700">₹${total.toFixed(2)}</td></tr>
  </table>`;
}

function footerHtml() {
  return `<div style="${styles.footer}">
    <div>Need help? Email support@calistalife.com</div>
    <div>Follow us: <a href="https://instagram.com" target="_blank">Instagram</a> • <a href="https://twitter.com" target="_blank">Twitter</a></div>
    <div>&copy; ${new Date().getFullYear()} CalistaLife</div>
  </div>`;
}

function baseLayout(title: string, body: string, cta?: { href: string; label: string }, logoUrl?: string) {
  return `
  <div style="${styles.wrapper}">
    <div style="${styles.container}">
      ${headerHtml(logoUrl)}
      <div style="${styles.card}">
        <h1 style="${styles.h1}">${title}</h1>
        ${body}
        ${cta ? `<div style=\"margin-top:16px\"><a href="${cta.href}" style="${styles.btn}">${cta.label}</a></div>` : ''}
        ${footerHtml()}
      </div>
    </div>
  </div>
  `;
}

export function renderOrderConfirmation({ order, items, logoUrl, trackUrl, estDelivery }: { order: any; items: any[]; logoUrl?: string; trackUrl?: string; estDelivery?: string; }) {
  const body = `
    <p style="${styles.p}">Order <b>#${order.order_number}</b> has been confirmed.</p>
    ${estDelivery ? `<p style=\"${styles.p}\">Estimated delivery: <b>${estDelivery}</b></p>` : ''}
    ${itemsHtml(items)}
    ${addressesHtml(order)}
    ${totalsHtml(order)}
  `;
  return baseLayout(`Order Confirmed - Your CalistaLife Order #${order.order_number}`, body, trackUrl ? { href: trackUrl, label: 'Track your order' } : undefined, logoUrl);
}

export function renderProcessing({ order, timelineNote, logoUrl }: { order: any; timelineNote?: string; logoUrl?: string; }) {
  const body = `
    <p style="${styles.p}">We're preparing your order <b>#${order.order_number}</b>.</p>
    ${timelineNote ? `<p style=\"${styles.p}\">${timelineNote}</p>` : ''}
  `;
  return baseLayout(`We're preparing your order #${order.order_number}`, body, undefined, logoUrl);
}

export function renderShipped({ order, trackingNumber, courier, logoUrl, trackUrl, estDelivery }: { order: any; trackingNumber?: string; courier?: string; logoUrl?: string; trackUrl?: string; estDelivery?: string; }) {
  const body = `
    <p style="${styles.p}">Your order <b>#${order.order_number}</b> has shipped.</p>
    ${trackingNumber ? `<p style=\"${styles.p}\">Tracking: <b>${trackingNumber}</b> ${courier ? `(via ${courier})` : ''}</p>` : ''}
    ${estDelivery ? `<p style=\"${styles.p}\">Expected delivery: <b>${estDelivery}</b></p>` : ''}
  `;
  return baseLayout(`Your CalistaLife order #${order.order_number} has shipped!`, body, trackUrl ? { href: trackUrl, label: 'Track package' } : undefined, logoUrl);
}

export function renderOutForDelivery({ order, windowText, logoUrl }: { order: any; windowText?: string; logoUrl?: string; }) {
  const body = `
    <p style="${styles.p}">Your order <b>#${order.order_number}</b> is out for delivery.</p>
    ${windowText ? `<p style=\"${styles.p}\">Expected delivery window: <b>${windowText}</b></p>` : ''}
  `;
  return baseLayout(`Your order #${order.order_number} is out for delivery today`, body, undefined, logoUrl);
}

export function renderDelivered({ order, logoUrl }: { order: any; logoUrl?: string; }) {
  const body = `
    <p style="${styles.p}">Your order <b>#${order.order_number}</b> was delivered. We hope you love it!</p>
    <p style="${styles.p}">Please consider leaving a review for your items.</p>
  `;
  return baseLayout(`Your CalistaLife order #${order.order_number} has been delivered`, body, undefined, logoUrl);
}

export function renderFollowUp({ order, logoUrl }: { order: any; logoUrl?: string; }) {
  const body = `
    <p style="${styles.p}">How was your experience with order <b>#${order.order_number}</b>?</p>
    <p style="${styles.p}">Here are some care tips and recommendations curated for you.</p>
  `;
  return baseLayout(`How was your CalistaLife experience?`, body, { href: (process.env.CLIENT_URL || 'http://localhost:5174') + '/orders', label: 'View your orders' }, logoUrl);
}