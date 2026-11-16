// API smoke test. Usage: npm run smoke
// Starts the server on a spare port, checks auth rules and security headers, exits non-zero on failure.
import { spawn } from 'node:child_process';

const PORT = process.env.SMOKE_PORT || '5099';
const B = `http://localhost:${PORT}`;
const server = spawn('node', ['server/server.js'], { env: { ...process.env, PORT, DEMO_MODE: 'true' }, stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let failed = 0;
const check = (name, ok) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) failed++; };
const get = (path, token) => fetch(B + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
const demo = async (role) => (await (await fetch(`${B}/api/auth/switch-demo`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ role }) })).json()).token;

try {
  for (let i = 0; i < 30; i++) { try { if ((await get('/healthz')).ok) break; } catch {} await sleep(300); }
  check('health endpoint', (await get('/healthz')).ok);
  check('courses are public', (await get('/api/courses')).status === 200);
  check('admin route blocks anonymous', (await get('/api/trainees')).status === 401);
  check('admin route blocks trainee', (await get('/api/trainees', await demo('trainee'))).status === 403);
  check('admin route allows admin', (await get('/api/trainees', await demo('admin'))).status === 200);
  check('security headers set', Boolean((await get('/healthz')).headers.get('content-security-policy')));
  const bad = await fetch(`${B}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'x@y.z', password: 'nope' }) });
  check('bad login rejected', bad.status === 401);
} finally {
  server.kill();
}
process.exit(failed ? 1 : 0);
