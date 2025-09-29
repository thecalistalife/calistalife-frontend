import 'dotenv/config';
import { sendOrderEmail } from '@/services/orderEmailService';

function arg(name: string) {
  const pref = `--${name}=`;
  const found = process.argv.find(a => a.startsWith(pref));
  return found ? found.slice(pref.length) : undefined;
}

async function main() {
  const to = arg('to') || process.env.ADMIN_MASTER_EMAIL || process.env.EMAIL_FROM;
  const type = (arg('type') || 'confirmed') as any;
  if (!to) {
    console.error('Usage: ts-node -r tsconfig-paths/register src/scripts/testOrderEmail.ts --to=recipient@example.com [--type=confirmed|processing|shipped|out_for_delivery|delivered|follow_up]');
    process.exit(1);
  }

  const order = {
    order_number: `CL${new Date().getFullYear()}${Math.floor(Math.random()*1e6).toString().padStart(6,'0')}`,
    shipping_address: { name: 'Test User', address1: '123 Street', city: 'City', state: 'State', zip: '12345', country: 'IN', phone: '+91 99999 99999', email: to },
    billing_address: { name: 'Test User', address1: '123 Street', city: 'City', state: 'State', zip: '12345', country: 'IN', phone: '+91 99999 99999', email: to },
    subtotal: 1499,
    shipping_cost: 0,
    tax: 0,
    total_amount: 1499,
  } as any;

  const items = [
    { name: 'Calista Tee', image: 'https://placehold.co/120x120?text=Tee', size: 'M', color: 'Black', quantity: 1, price: 899 },
    { name: 'Calista Cap', image: 'https://placehold.co/120x120?text=Cap', size: 'Free', color: 'White', quantity: 1, price: 600 },
  ];

  console.log(`Sending ${type} email to ${to} ...`);
  try {
    if (type === 'shipped') {
      await sendOrderEmail('shipped', { order, items, trackingNumber: 'TRK123456789', courier: 'Shiprocket', trackUrl: 'https://tracking.example.com/TRK123456789', estDelivery: new Date(Date.now()+3*86400000).toISOString() });
    } else if (type === 'out_for_delivery') {
      await sendOrderEmail('out_for_delivery', { order, items, windowText: 'Today 2–6 PM' });
    } else if (type === 'delivered') {
      await sendOrderEmail('delivered', { order, items });
    } else if (type === 'follow_up') {
      await sendOrderEmail('follow_up', { order, items });
    } else if (type === 'processing') {
      await sendOrderEmail('processing', { order, items });
    } else {
      await sendOrderEmail('confirmed', { order, items, trackUrl: 'https://calistalife.com/orders' });
    }
    console.log('OK: email queued/sent via providers');
  } catch (e: any) {
    console.error('FAILED:', e?.message || e);
    process.exit(2);
  }
}

main().catch((e) => { console.error(e); process.exit(2); });