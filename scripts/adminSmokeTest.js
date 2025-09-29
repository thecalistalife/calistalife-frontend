/* ESM wrapper to load CJS */
import('./adminSmokeTest.cjs').catch((e)=>{ console.error('SMOKETEST_FAIL:', e?.message||e); process.exit(1); });
