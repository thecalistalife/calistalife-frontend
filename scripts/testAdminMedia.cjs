/*
Test media upload via admin: login, create product, upload an image.
Server must be running on http://localhost:3001
*/
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ADMIN_BASE = `/${process.env.VITE_ADMIN_BASE_PATH || process.env.ADMIN_BASE_PATH || 'cl-private-dashboard-2024'}`;
const BASE_URL = { hostname: 'localhost', port: 3001 };
const paths = {
  login: `/api${ADMIN_BASE}/auth/login`,
  products: `/api${ADMIN_BASE}/products`,
  upload: `/api${ADMIN_BASE}/media/upload`,
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

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed: ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(dest)));
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

(async () => {
  try {
    // Login
    const email = process.env.ADMIN_MASTER_EMAIL || 'madhurkharade9@gmail.com';
    const password = process.env.ADMIN_MASTER_PASSWORD || 'Madhurkharade_6082342';
    const loginBody = JSON.stringify({ email, password });
    let resp = await request(paths.login, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) }, body: loginBody });
    if (resp.status !== 200) throw new Error('Login failed: ' + resp.body);
    const cookieHeader = (resp.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');

    // Create a product to attach image
    const prodName = 'E2E Media Product ' + new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const prodPayload = { name: prodName, price: 1499, inStock: true, stockQuantity: 3, status: 'active', sizes: ['M'], colors: ['Black'] };
    const prodBody = JSON.stringify(prodPayload);
    resp = await request(paths.products, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(prodBody), Cookie: cookieHeader }, body: prodBody });
    if (resp.status !== 201) throw new Error('Create product failed: ' + resp.body);
    const product = JSON.parse(resp.body).data;

    // Download a small image
    const tmpDir = path.resolve(__dirname, '.tmp');
    try { fs.mkdirSync(tmpDir); } catch {}
    const imgPath = path.join(tmpDir, 'test-upload.jpg');
    await download('https://placehold.co/600x400.jpg', imgPath);

    // Upload via curl
    const url = `http://localhost:3001${paths.upload}`;
    await new Promise((resolve, reject) => {
      const args = ['-s', '-S', '-f', '-X', 'POST',
        '-F', `file=@${imgPath};type=image/jpeg`,
        '-F', `productId=${product.id}`,
        '-b', cookieHeader,
        url,
      ];
      const child = spawn('curl', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '', err = '';
      child.stdout.on('data', (d) => out += d.toString());
      child.stderr.on('data', (d) => err += d.toString());
      child.on('exit', (code) => {
        if (code === 0) {
          try {
            const json = JSON.parse(out);
            if (!json.success) return reject(new Error('Upload JSON not success'));
            console.log('TEST_MEDIA_OK:', product.id);
            resolve();
          } catch (e) {
            reject(new Error('Invalid JSON from upload: ' + out));
          }
        } else {
          reject(new Error('curl failed: ' + err));
        }
      });
    });
  } catch (e) {
    console.error('TEST_MEDIA_FAIL:', e.message);
    process.exit(1);
  }
})();
