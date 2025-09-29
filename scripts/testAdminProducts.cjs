/*
Test admin product visibility end-to-end using HTTP (server must be running on 3001)
*/
const http = require('http');

const ADMIN_BASE = `/${process.env.VITE_ADMIN_BASE_PATH || process.env.ADMIN_BASE_PATH || 'cl-private-dashboard-2024'}`;
const BASE_URL = { hostname: 'localhost', port: 3001 };
const paths = {
  login: `/api${ADMIN_BASE}/auth/login`,
  products: `/api${ADMIN_BASE}/products`,
  publicProducts: `/api/products`,
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

    // Create product (active + in stock)
    const prodName = 'E2E Product ' + new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const prodPayload = { name: prodName, price: 2999, inStock: true, stockQuantity: 10, status: 'active', sizes: ['S','M','L'], colors: ['Black','White'] };
    const prodBody = JSON.stringify(prodPayload);
    resp = await request(paths.products, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(prodBody), Cookie: cookieHeader }, body: prodBody });
    if (resp.status !== 201) throw new Error('Create product failed: ' + resp.body);
    const created = JSON.parse(resp.body).data;

    // Verify visible via public API newest-first
    const list = await request(`${paths.publicProducts}?sortBy=newest&limit=1`);
    if (list.status !== 200) throw new Error('Public products failed: ' + list.body);
    const parsed = JSON.parse(list.body);
    const newest = (parsed.data || [])[0];
    if (!newest || newest.id !== created.id) {
      console.log('WARN: newest product is not the one we just created. Checking broader list...');
      const all = await request(`${paths.publicProducts}?sortBy=newest&limit=25`);
      const arr = JSON.parse(all.body).data || [];
      const found = arr.find((p) => p.id === created.id);
      if (!found) throw new Error('Newly created product not visible in public list');
    }

    console.log('TEST_PRODUCTS_OK:', created.id, prodName);
  } catch (e) {
    console.error('TEST_PRODUCTS_FAIL:', e.message);
    process.exit(1);
  }
})();
