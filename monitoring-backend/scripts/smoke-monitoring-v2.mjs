// Local deployed smoke test. Credentials come from env; never print tokens or payload data.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { io } = require('socket.io-client');
const base = 'http://127.0.0.1:4000';
const credentials = { corporateEmail: process.env.DASHBOARD_ADMIN_EMAIL, password: process.env.DASHBOARD_ADMIN_PASSWORD };
if (!credentials.corporateEmail || !credentials.password) throw new Error('Local test login configuration required');
const timings = [];
async function get(path, token) {
  const started = performance.now();
  const response = await fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(15000) });
  timings.push({ path, status: response.status, ms: +(performance.now() - started).toFixed(2) });
  return response;
}
const anonymous = await get('/endpoint-observability/snapshot');
assert.equal(anonymous.status, 401);
const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials), signal: AbortSignal.timeout(15000) });
assert.equal(login.status, 200, 'Login failed; no automatic credential retries');
const session = await login.json();
const token = session.tokens.accessToken;
let socket;
try {
  const snapshotResponse = await get('/endpoint-observability/snapshot', token);
  assert.equal(snapshotResponse.status, 200);
  const snapshot = await snapshotResponse.json();
  assert(snapshot.cursor?.streamId);
  assert(snapshot.endpoints.length > 0, 'No discovered endpoints');
  assert.equal(snapshot.instances.length, 2);
  assert(snapshot.instances.every((instance) => instance.state === 'AVAILABLE'));
  for (const path of ['/incidents', '/alerts', '/notifications', '/analytics/banking']) {
    const response = await get(path, token);
    assert.equal(response.status, 200, `Unavailable ${path}`);
    if (path === '/analytics/banking') assert.equal((await response.json()).source, 'POSTGRESQL_BUSINESS_OPERATIONS');
  }
  for (let i = 0; i < 10; i++) assert.equal((await get('/endpoint-observability/snapshot', token)).status, 200);
  socket = io(`${base}/operations`, { transports: ['websocket'], autoConnect: false, reconnection: false, auth: { token }, extraHeaders: { Origin: 'http://localhost:5173' } });
  const eventPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No operational event within 15 seconds')), 15000);
    socket.once('connect_error', () => { clearTimeout(timer); reject(new Error('Operational connection denied')); });
    socket.once('operational.event', (event) => { clearTimeout(timer); resolve(event); });
  });
  socket.connect();
  const event = await eventPromise;
  assert.equal(event.schemaVersion, 1);
  assert.equal(event.channel, 'endpoints');
  console.log(JSON.stringify({ passed: true, endpoints: snapshot.endpoints.length, instances: snapshot.instances.map(({ id, state }) => ({ id, state })), websocketEvent: event.eventType, timings, environment: 'local Docker with configured Supabase; GET aggregates only' }, null, 2));
} finally {
  socket?.disconnect();
  await fetch(`${base}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
}
