import { performance } from 'node:perf_hooks';

const baseUrl = (process.env.MONITOR_BENCH_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '');
const email = process.env.MONITOR_BENCH_EMAIL ?? process.env.DASHBOARD_ADMIN_EMAIL;
const password = process.env.MONITOR_BENCH_PASSWORD ?? process.env.DASHBOARD_ADMIN_PASSWORD;
const samples = Math.min(Math.max(Number(process.env.MONITOR_BENCH_SAMPLES ?? 10), 1), 100);

if (!email || !password) {
  throw new Error('Configura credenciales de benchmark o carga el .env local del monitor.');
}

function percentile(values, percent) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil((percent / 100) * sorted.length) - 1];
}

function round(value) {
  return Number(value.toFixed(2));
}

async function timedRequest(path, init = {}) {
  const started = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error(`${init.method ?? 'GET'} ${path} devolvió HTTP ${response.status}`);
  const body = response.status === 204 ? undefined : await response.json();
  const durationMs = performance.now() - started;
  return { durationMs, body };
}

const login = await timedRequest('/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ corporateEmail: email, password }),
});
const accessToken = login.body.tokens.accessToken;
const authorization = { authorization: `Bearer ${accessToken}` };
const rows = [
  {
    endpoint: 'POST /auth/login',
    samples: 1,
    p50Ms: round(login.durationMs),
    p95Ms: round(login.durationMs),
    maxMs: round(login.durationMs),
  },
];

for (const path of [
  '/auth/me',
  '/dashboard/overview',
  '/dashboard/metrics',
  '/dashboard/activity?limit=12',
  '/dashboard/topology',
  '/endpoint-observability',
]) {
  const durations = [];
  for (let index = 0; index < samples; index += 1) {
    const result = await timedRequest(path, { headers: authorization });
    durations.push(result.durationMs);
  }
  rows.push({
    endpoint: `GET ${path}`,
    samples,
    p50Ms: round(percentile(durations, 50)),
    p95Ms: round(percentile(durations, 95)),
    maxMs: round(Math.max(...durations)),
  });
}

await timedRequest('/auth/logout', {
  method: 'POST',
  headers: { ...authorization, 'content-type': 'application/json' },
  body: '{}',
});

console.log(`Base: ${baseUrl} · muestras por lectura: ${samples}`);
console.table(rows);
