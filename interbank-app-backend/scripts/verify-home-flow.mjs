import { randomUUID } from 'node:crypto';

const baseUrl = process.env.VERIFY_BASE_URL ?? 'http://127.0.0.1:3000';

async function request(path, options = {}) {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, options);
  const elapsedMs = performance.now() - startedAt;
  const payload = await response.json();
  return { response, payload, elapsedMs };
}

function jsonOptions(method, body, accessToken, idempotencyKey) {
  return {
    method,
    headers: {
      'content-type': 'application/json',
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  };
}

const unauthorized = await request('/home');
if (unauthorized.response.status !== 401) throw new Error('GET /home must require JWT');

const login = await request(
  '/auth/login',
  jsonOptions('POST', {
    documentNumber: process.env.VERIFY_DOCUMENT_NUMBER ?? '12345678',
    email: process.env.VERIFY_EMAIL ?? 'demo@interbank.test',
    password: process.env.VERIFY_PASSWORD ?? 'DemoSecure123!',
    deviceId: process.env.VERIFY_DEVICE_ID ?? '550e8400-e29b-41d4-a716-446655440000',
    deviceName: 'Home flow verification',
  }),
);
if (!login.response.ok) throw new Error(`Login failed with ${login.response.status}`);

const accessToken = login.payload.token.accessToken;
const authenticatedGet = (path) =>
  request(path, { headers: { authorization: `Bearer ${accessToken}` } });
const homeBefore = await authenticatedGet('/home');
if (!homeBefore.response.ok) throw new Error(`GET /home failed with ${homeBefore.response.status}`);
const homeCached = await authenticatedGet('/home');
if (!homeCached.response.ok) throw new Error('Cached GET /home failed');

const penAccounts = homeBefore.payload.accounts.filter((account) => account.currency === 'PEN');
if (penAccounts.length < 2) throw new Error('At least two PEN accounts are required');
const [source, destination] = penAccounts;
const penBefore = Number(
  homeBefore.payload.balances.find((balance) => balance.currency === 'PEN').availableBalance,
);
const usdBefore = Number(
  homeBefore.payload.balances.find((balance) => balance.currency === 'USD').availableBalance,
);

const transfer = await request(
  '/transfers',
  jsonOptions(
    'POST',
    {
      fromAccountId: source.id,
      toAccountId: destination.id,
      amount: 25.5,
      description: 'Transferencia de verificación',
    },
    accessToken,
    randomUUID(),
  ),
);
if (!transfer.response.ok) {
  throw new Error(
    `Transfer failed with ${transfer.response.status}: ${JSON.stringify(transfer.payload)}`,
  );
}

const payment = await request(
  '/service-payments',
  jsonOptions(
    'POST',
    {
      accountId: source.id,
      provider: 'LUZ_DEL_SUR',
      customerReference: 'VERIFY-123456',
      amount: 10,
    },
    accessToken,
  ),
);
if (!payment.response.ok) {
  throw new Error(
    `Service payment failed with ${payment.response.status}: ${JSON.stringify(payment.payload)}`,
  );
}

const [homeAfter, movements] = await Promise.all([
  authenticatedGet('/home'),
  authenticatedGet(`/accounts/${source.id}/transactions?limit=10`),
]);
if (!homeAfter.response.ok || !movements.response.ok) throw new Error('Final reads failed');

const penAfter = Number(
  homeAfter.payload.balances.find((balance) => balance.currency === 'PEN').availableBalance,
);
const usdAfter = Number(
  homeAfter.payload.balances.find((balance) => balance.currency === 'USD').availableBalance,
);
if (penAfter !== penBefore - 10)
  throw new Error('PEN total does not reflect only the service payment');
if (usdAfter !== usdBefore) throw new Error('USD total changed unexpectedly');

console.table({
  authorization: { result: '401 without JWT' },
  home: { result: `${homeAfter.payload.accounts.length} accounts; PEN and USD` },
  homeInitialLatency: { result: `${homeBefore.elapsedMs.toFixed(2)} ms` },
  homeCachedLatency: { result: `${homeCached.elapsedMs.toFixed(2)} ms` },
  homeAfterInvalidation: { result: `${homeAfter.elapsedMs.toFixed(2)} ms` },
  transfer: { result: transfer.payload.status },
  servicePayment: { result: payment.payload.status },
  movements: { result: `${movements.payload.length} returned` },
  balances: { result: `PEN ${penAfter.toFixed(2)}; USD ${usdAfter.toFixed(2)}` },
});
