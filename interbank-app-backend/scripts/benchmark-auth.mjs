import { performance } from 'node:perf_hooks';

const baseUrl = process.env.BENCHMARK_BASE_URL ?? 'http://127.0.0.1:3000';
const documentNumber = process.env.BENCHMARK_DOCUMENT_NUMBER ?? '12345678';
const email = process.env.BENCHMARK_EMAIL ?? 'demo@interbank.test';
const password = process.env.BENCHMARK_PASSWORD ?? 'DemoSecure123!';
const deviceId = process.env.BENCHMARK_DEVICE_ID ?? '550e8400-e29b-41d4-a716-446655440000';
const requestedSamples = Number(process.env.BENCHMARK_SAMPLES ?? 5);
const firstLoginBudgetMs = Number(process.env.BENCHMARK_FIRST_LOGIN_BUDGET_MS ?? 2500);
const deviceLoginP95BudgetMs = Number(process.env.BENCHMARK_DEVICE_LOGIN_P95_BUDGET_MS ?? 100);
const samples = Number.isInteger(requestedSamples) ? Math.min(Math.max(requestedSamples, 1), 5) : 5;

async function post(path, body) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const elapsedMs = performance.now() - startedAt;
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${JSON.stringify(payload)}`);
  }

  return { elapsedMs, payload };
}

function percentile(values, percentileValue) {
  const ordered = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil((percentileValue / 100) * ordered.length) - 1);
  return ordered[index];
}

function round(value) {
  return Number(value.toFixed(2));
}

const firstLogin = await post('/auth/login', {
  documentNumber,
  email,
  password,
  deviceId,
  deviceName: 'Authentication benchmark',
});

let sessionToken = firstLogin.payload.session.sessionToken;
let rotatedEveryTime = true;
const deviceLoginTimes = [];

for (let index = 0; index < samples; index += 1) {
  const previousToken = sessionToken;
  const result = await post('/auth/device-login', { sessionToken, deviceId, password });
  sessionToken = result.payload.session.sessionToken;
  rotatedEveryTime &&= previousToken !== sessionToken;
  deviceLoginTimes.push(result.elapsedMs);
}

const average = deviceLoginTimes.reduce((total, value) => total + value, 0) / samples;
const deviceLoginP95 = percentile(deviceLoginTimes, 95);

console.table({
  firstLogin: { samples: 1, averageMs: round(firstLogin.elapsedMs), p50Ms: '-', p95Ms: '-' },
  deviceLogin: {
    samples,
    averageMs: round(average),
    p50Ms: round(percentile(deviceLoginTimes, 50)),
    p95Ms: round(deviceLoginP95),
  },
});
console.log(`Session rotated on every device login: ${rotatedEveryTime}`);
console.log(`Device login samples (ms): ${deviceLoginTimes.map(round).join(', ')}`);

const violations = [
  firstLogin.elapsedMs > firstLoginBudgetMs
    ? `first-login exceeded ${firstLoginBudgetMs} ms`
    : null,
  deviceLoginP95 > deviceLoginP95BudgetMs
    ? `device-login p95 exceeded ${deviceLoginP95BudgetMs} ms`
    : null,
  !rotatedEveryTime ? 'the session token was not rotated on every device-login' : null,
].filter(Boolean);

if (violations.length > 0) {
  console.error(`Performance budget failed: ${violations.join('; ')}`);
  process.exitCode = 1;
} else {
  console.log(
    `Performance budget passed: first-login <= ${firstLoginBudgetMs} ms; device-login p95 <= ${deviceLoginP95BudgetMs} ms`,
  );
}
