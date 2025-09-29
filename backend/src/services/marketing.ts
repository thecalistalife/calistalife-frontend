import { brevo } from './brevoClient';
import { abandonedCartHeartbeat } from './abandonedCart';

export type CartItemEvent = { id: string; name?: string; price?: number; qty: number };

function getSiteKey() {
  return process.env.BREVO_MA_SITE_KEY || process.env.BREVO_MARKETING_AUTOMATION_SITE_KEY || '';
}

export async function upsertContact(opts: {
  email: string;
  firstName?: string;
  lastName?: string;
  attributes?: Record<string, any>;
  listIds?: number[];
}) {
  const { email, firstName, lastName, attributes = {}, listIds } = opts;
  const payload: any = {
    email,
    attributes: { FIRSTNAME: firstName, LASTNAME: lastName, ...attributes },
    updateEnabled: true,
  };
  if (listIds?.length) payload.listIds = listIds;

  try {
    await brevo.contacts.createContact(payload);
  } catch (e: any) {
    if (e?.response?.body?.code === 'duplicate_parameter') {
      await brevo.contacts.updateContact(email, {
        attributes: payload.attributes,
        listIds,
      } as any);
    } else {
      throw e;
    }
  }
}

export async function trackEventServer(event: string, email: string, properties: Record<string, any> = {}) {
  const maKey = getSiteKey();
  if (!maKey) return;
  try {
    await fetch('https://in-automate.brevo.com/api/v2/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ma-key': maKey,
      },
      body: JSON.stringify({ event, email, properties }),
    });
  } catch {
    // best-effort
  }
}

export async function trackPurchase(params: {
  email: string;
  orderNumber: string;
  total: number;
  items: Array<CartItemEvent>;
}) {
  const { email, orderNumber, total, items } = params;
  await trackEventServer('purchase', email, { orderNumber, total, items });

  const nowISO = new Date().toISOString();
  const attrLTV = process.env.BREVO_ATTR_LTV || 'LTV';
  const attrLastOrder = process.env.BREVO_ATTR_LAST_ORDER_DATE || 'LAST_ORDER_DATE';
  const attrTotalOrders = process.env.BREVO_ATTR_TOTAL_ORDERS || 'TOTAL_ORDERS';

  await upsertContact({
    email,
    attributes: {
      [attrLastOrder]: nowISO,
      [attrLTV]: total,
      [attrTotalOrders]: 1,
    },
    listIds: process.env.BREVO_LIST_CUSTOMERS ? [parseInt(process.env.BREVO_LIST_CUSTOMERS, 10)] : undefined,
  });
}

export async function trackCartUpdated(email: string, payload: { items: CartItemEvent[]; cartTotal?: number }) {
  try { abandonedCartHeartbeat(email, { items: payload.items, cartTotal: payload.cartTotal }); } catch {}
  await trackEventServer('cart_updated', email, payload);
}

export async function subscribeNewsletter(email: string, firstName?: string) {
  const listId = process.env.BREVO_LIST_NEWSLETTER ? parseInt(process.env.BREVO_LIST_NEWSLETTER, 10) : undefined;
  await upsertContact({ email, firstName, listIds: listId ? [listId] : undefined });
  await trackEventServer('newsletter_signup', email, {});
}

export async function setContactDates(email: string, birthdateISO?: string, anniversaryISO?: string) {
  const attrBirth = process.env.BREVO_ATTR_BIRTHDATE || 'BIRTHDATE';
  const attrAnn = process.env.BREVO_ATTR_ANNIVERSARY || 'ANNIVERSARY';
  const attributes: Record<string, any> = {};
  if (birthdateISO) attributes[attrBirth] = birthdateISO;
  if (anniversaryISO) attributes[attrAnn] = anniversaryISO;
  if (Object.keys(attributes).length) await upsertContact({ email, attributes });
}