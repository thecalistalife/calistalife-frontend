/*
Test admin order creation and confirmation email trigger using HTTP (server must be running on 3001)
*/
const http = require('http');

const ADMIN_BASE = `/${process.env.VITE_ADMIN_BASE_PATH || process.env.ADMIN_BASE_PATH || 'cl-private-dashboard-2024'}`;
const BASE_URL = { hostname: 'localhost', port: 3001 };
const paths = {
  login: `/api${ADMIN_BASE}/auth/login`,
  products: `/api${ADMIN_BASE}/products`,
  orderCreate: `/api/orders/create`,
};

function request(path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const opts = { ...BASE_URL, path, method, headers };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    // Health check
    const health = await request('/api/health');
    if (health.status !== 200) throw new Error('Backend not healthy');

    // Login as admin
    const email = process.env.ADMIN_MASTER_EMAIL || 'madhurkharade9@gmail.com';
const password = process.env.ADMIN_MASTER_PASSWORD || 'Madhurkharade_6082342';
    const loginBody = JSON.stringify({ email, password });
    let resp = await request(paths.login, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }, body: loginBody });
    if (resp.status !== 200) throw new Error('Login failed: ' + resp.body);
    const cookieHeader = (resp.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');

    // Create a product to order
    const prodName = 'E2E Order Product ' + new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const prodPayload = { name: prodName, price: 1999, inStock: true, stockQuantity: 5, status: 'active', sizes: ['M'], colors: ['Black'] };
    const prodBody = JSON.stringify(prodPayload);
    resp = await request(paths.products, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(prodBody), Cookie: cookieHeader }, body: prodBody });
    if (resp.status !== 201) throw new Error('Create product failed: ' + resp.body);
    const product = JSON.parse(resp.body).data;

    // Create order for this product
    const customerEmail = process.env.TEST_ORDER_EMAIL || 'madhurkharade9@gmail.com';
    const orderPayload = {
      items: [{ productId: product.id, name: product.name, image: (product.images||[])[0], size: 'M', color: 'Black', quantity: 1, price: product.price }],
      shippingAddress: { name: 'Test Buyer', email: customerEmail, address1: '123 Street', city: 'Pune', state: 'MH', zip: '411001', country: 'IN' },
      billingAddress: { name: 'Test Buyer', email: customerEmail, address1: '123 Street', city: 'Pune', state: 'MH', zip: '411001', country: 'IN' },
      subtotal: product.price,
      shippingCost: 0,
      tax: 0,
      totalAmount: product.price,
      payment: { method: 'cod', status: 'paid' },
      notes: 'E2E test order',
    };
    const orderBody = JSON.stringify(orderPayload);
    resp = await request(paths.orderCreate, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(orderBody) }, body: orderBody });
    if (resp.status !== 200) throw new Error('Order create failed: ' + resp.body);
    const orderRes = JSON.parse(resp.body);
    const orderNumber = orderRes?.data?.orderNumber;
    if (!orderNumber) throw new Error('Order number missing in response');

    console.log('TEST_ORDERS_OK:', orderNumber);
  } catch (e) {
    console.error('TEST_ORDERS_FAIL:', e.message);
    process.exit(1);
  }
})();
