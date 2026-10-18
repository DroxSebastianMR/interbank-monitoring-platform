import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';

const require = createRequire(import.meta.url);
const {
  EndpointObservabilityService,
} = require('../dist/modules/endpoint-observability/services/endpoint-observability.service.js');
const {
  ENDPOINT_QUERIES,
} = require('../dist/modules/endpoint-observability/constants/endpoint-observability.constants.js');
const targets = ['app-backend-1:3000', 'app-backend-2:3000'];
const now = Date.now() / 1000;
const sample = (metric, value) => ({ metric, value: [now, String(value)] });
const catalog = targets.flatMap((instance) =>
  Array.from({ length: 250 }, (_, i) =>
    sample(
      { instance, module: `Module-${i % 20}`, method: 'GET', route: `/resource-${i}/{id}` },
      1,
    ),
  ),
);
let queries = 0;
const service = new EndpointObservabilityService({
  async query(query) {
    queries++;
    await new Promise((resolve) => setTimeout(resolve, 25));
    if (query === ENDPOINT_QUERIES.catalog) return catalog;
    if (query === ENDPOINT_QUERIES.up) return targets.map((instance) => sample({ instance }, 1));
    if (query === ENDPOINT_QUERIES.scrapedAt)
      return targets.map((instance) => sample({ instance }, now));
    return [];
  },
});
const start = performance.now();
const cold = await service.snapshot();
const coldMs = performance.now() - start;
const durations = [];
for (let i = 0; i < 1000; i++) {
  const started = performance.now();
  JSON.stringify(await service.snapshot());
  durations.push(performance.now() - started);
}
durations.sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      mode: 'Synthetic in-process benchmark; NOT Docker, authentication, network or real Prometheus latency',
      endpoints: cold.endpoints.length,
      upstreamQueries: queries,
      simulatedUpstreamMs: 25,
      coldMs: +coldMs.toFixed(3),
      cachedWithSerializationP50Ms: +durations[499].toFixed(3),
      cachedWithSerializationP95Ms: +durations[949].toFixed(3),
      payloadBytes: Buffer.byteLength(JSON.stringify(cold)),
    },
    null,
    2,
  ),
);
