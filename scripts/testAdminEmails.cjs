/*
Test order confirmation email pathway by creating an order (server must be running on 3001)
Note: This validates HTTP 200 and does not verify inbox delivery. Ensure EMAIL provider is configured.
*/
const { spawn } = require('child_process');
const path = require('path');

(async () => {
  try {
    const script = path.resolve(__dirname, 'testAdminOrders.cjs');
    const child = spawn(process.execPath, [script], { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) {
        console.log('TEST_EMAILS_OK');
        process.exit(0);
      } else {
        console.error('TEST_EMAILS_FAIL');
        process.exit(code || 1);
      }
    });
  } catch (e) {
    console.error('TEST_EMAILS_FAIL:', e.message);
    process.exit(1);
  }
})();
