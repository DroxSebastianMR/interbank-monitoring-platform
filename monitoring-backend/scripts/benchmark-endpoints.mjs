import { performance } from 'node:perf_hooks';

const baseUrl = (process.env.MONITOR_BENCH_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '');
const requestedSamples = Number(process.env.MONITOR_BENCH_SAMPLES ?? 10);
const samples = Number.isInteger(requestedSamples)
  ? Math.min(Math.max(requestedSamples, 1), 100)
  : 10;
const includeWrites = process.env.MONITOR_BENCH_INCLUDE_WRITES === '1';
let accessToken = process.env.MONITOR_BENCH_ACCESS_TOKEN;
let refreshToken = process.env.MONITOR_BENCH_REFRESH_TOKEN;

function percentile(values, percent) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil((percent / 100) * sorted.length) - 1];
}

function round(value) {
  return Number(value.toFixed(2));
}

function endpointPlan(method, path) {
  if (method === 'get') return { samples, body: undefined };
  if (method === 'post' && path === '/ai/predict') {
    return { samples, body: { latency: 50, errorRate: 0, timeoutRate: 0, requestRate: 1 } };
  }
  if (method === 'post' && path === '/assistant/ask') {
    return {
      samples: Math.min(samples, 5),
      body: { question: '¿Cómo está el servicio de login?' },
      auth: true,
    };
  }
  if (!includeWrites) return { skip: 'requiere MONITOR_BENCH_INCLUDE_WRITES=1' };
  if (method === 'post' && path === '/auth/login') {
    const corporateEmail = process.env.MONITOR_BENCH_EMAIL ?? process.env.DASHBOARD_ADMIN_EMAIL;
    const password = process.env.MONITOR_BENCH_PASSWORD ?? process.env.DASHBOARD_ADMIN_PASSWORD;
    return corporateEmail && password
      ? { samples: 1, body: { corporateEmail, password } }
      : {
          skip: 'faltan MONITOR_BENCH_EMAIL/MONITOR_BENCH_PASSWORD o las credenciales admin locales',
        };
  }
  if (method === 'post' && path === '/auth/refresh') {
    return refreshToken
      ? { samples: 1, body: { refreshToken } }
      : { skip: 'falta MONITOR_BENCH_REFRESH_TOKEN o login previo' };
  }
  if (method === 'post' && path === '/auth/logout') {
    return { samples: 1, body: {}, auth: true, last: true };
  }
  if (method === 'post' && path === '/monitoring/run') {
    return { samples: 1, body: {} };
  }
  if (method === 'post' && path === '/monitoring/{id}/check') {
    return { samples: 1, body: {}, path: '/monitoring/login/check' };
  }
  if (method === 'put' && path === '/access-control/employees/{employeeId}/roles') {
    const employeeId = process.env.MONITOR_BENCH_EMPLOYEE_ID;
    const roleCodes = process.env.MONITOR_BENCH_ROLE_CODES?.split(',').map((code) => code.trim());
    return employeeId && roleCodes?.length
      ? {
          samples: 1,
          body: { roleCodes },
          path: `/access-control/employees/${encodeURIComponent(employeeId)}/roles`,
          auth: true,
        }
      : { skip: 'faltan MONITOR_BENCH_EMPLOYEE_ID y MONITOR_BENCH_ROLE_CODES' };
  }
  return { skip: 'sin fixture segura para esta ruta' };
}

async function sampleEndpoint(method, path, plan) {
  const durations = [];
  const codes = new Set();
  for (let index = 0; index < plan.samples; index += 1) {
    const headers = { accept: 'application/json' };
    if (plan.body !== undefined) headers['content-type'] = 'application/json';
    if (accessToken) headers.authorization = `Bearer ${accessToken}`;
    const start = performance.now();
    let response;
    try {
      response = await fetch(`${baseUrl}${plan.path ?? path}`, {
        method: method.toUpperCase(),
        headers,
        body: plan.body === undefined ? undefined : JSON.stringify(plan.body),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (error) {
      return { endpoint: `${method.toUpperCase()} ${path}`, result: `ERROR: ${error.message}` };
    }
    durations.push(performance.now() - start);
    codes.add(response.status);
    if (response.ok && (path === '/auth/login' || path === '/auth/refresh')) {
      const payload = await response.json();
      accessToken = payload.tokens?.accessToken ?? accessToken;
      refreshToken = payload.tokens?.refreshToken ?? refreshToken;
      if (path === '/auth/refresh') plan.body.refreshToken = refreshToken;
    } else {
      await response.arrayBuffer();
    }
    if (!response.ok) break;
  }
  const success = [...codes].every((code) => code >= 200 && code < 300);
  return {
    endpoint: `${method.toUpperCase()} ${path}`,
    result: success ? 'OK' : `HTTP ${[...codes].join(',')}`,
    samples: durations.length,
    p50Ms: round(percentile(durations, 50)),
    p95Ms: round(percentile(durations, 95)),
    maxMs: round(Math.max(...durations)),
  };
}

let specification;
try {
  const response = await fetch(`${baseUrl}/api/docs-json`, { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`OpenAPI devolvió HTTP ${response.status}`);
  specification = await response.json();
} catch (error) {
  console.error(`No se pudo medir ${baseUrl}: ${error.message}`);
  process.exitCode = 1;
}

if (specification) {
  const operations = Object.entries(specification.paths)
    .flatMap(([path, methods]) =>
      Object.keys(methods)
        .filter((method) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
        .map((method) => ({ method, path })),
    )
    .sort((left, right) => {
      if (left.path === '/auth/login') return -1;
      if (right.path === '/auth/login') return 1;
      if (left.path === '/auth/logout') return 1;
      if (right.path === '/auth/logout') return -1;
      return `${left.path} ${left.method}`.localeCompare(`${right.path} ${right.method}`);
    });
  const rows = [];
  for (const { method, path } of operations) {
    const plan = endpointPlan(method, path);
    const protectedRoute = specification.paths[path][method].security?.length > 0;
    if (plan.skip || ((plan.auth || protectedRoute) && !accessToken)) {
      rows.push({
        endpoint: `${method.toUpperCase()} ${path}`,
        result: plan.skip ?? 'omitido: falta MONITOR_BENCH_ACCESS_TOKEN',
      });
      continue;
    }
    rows.push(await sampleEndpoint(method, path, plan));
  }
  console.log(
    `Base: ${baseUrl} · muestras GET: ${samples} · escrituras: ${includeWrites ? 'sí' : 'no'}`,
  );
  console.table(rows);
  if (rows.some((row) => row.result.startsWith('HTTP ') || row.result.startsWith('ERROR:'))) {
    process.exitCode = 1;
  }
}
