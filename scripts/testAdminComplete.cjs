/*
Run complete admin-to-customer journey checks (server must be running on 3001)
*/
const { spawn } = require('child_process');
const path = require('path');

function run(script) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.resolve(__dirname, script)], { stdio: 'inherit' });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(script + ' failed with code ' + code)));
  });
}

(async () => {
  try {
    await run('testAdminProducts.cjs');
    await run('testAdminOrders.cjs');
    await run('testAdminEmails.cjs');
    console.log('TEST_COMPLETE_OK');
  } catch (e) {
    console.error('TEST_COMPLETE_FAIL:', e.message);
    process.exit(1);
  }
})();
