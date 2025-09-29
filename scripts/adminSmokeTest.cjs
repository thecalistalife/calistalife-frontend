/*
Admin smoke test: logs in and creates a minimal product via backend admin API.
Usage:
  node ./scripts/adminSmokeTest.js
*/
const http = require('http');
const ADMIN_BASE = `/${process.env.VITE_ADMIN_BASE_PATH || process.env.ADMIN_BASE_PATH || 'cl-private-dashboard-2024'}`;
const LOGIN_PATH = `/api${ADMIN_BASE}/auth/login`;
const PROD_PATH = `/api${ADMIN_BASE}/products`;
const EMAIL = process.env.ADMIN_MASTER_EMAIL || 'madhurkharade9@gmail.com';
const PASSWORD = process.env.ADMIN_MASTER_PASSWORD || 'Madhurkharade_6082342';
function request(opts, body) {
  return new Promise((resolve, reject) => {
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
    const loginBody = JSON.stringify({ email: EMAIL, password: PASSWORD });
    let resp = await request({ hostname: 'localhost', port: 3001, path: LOGIN_PATH, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) } }, loginBody);
    if (resp.status !== 200) throw new Error('Login failed: ' + resp.body);
    const setCookie = resp.headers['set-cookie'] || [];
    const cookieHeader = setCookie.map((c) => c.split(';')[0]).join('; ');
    const prodName = 'Agent Test ' + new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const prodBody = JSON.stringify({ name: prodName, price: 49.99 });
    resp = await request({ hostname: 'localhost', port: 3001, path: PROD_PATH, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(prodBody), Cookie: cookieHeader } }, prodBody);
    if (resp.status !== 201) throw new Error('Create product failed: ' + resp.body);
    const parsed = JSON.parse(resp.body);
    console.log('SMOKETEST_OK: created product', parsed.data.id, prodName);
  } catch (e) {
    console.error('SMOKETEST_FAIL:', e.message);
    process.exit(1);
  }
})();