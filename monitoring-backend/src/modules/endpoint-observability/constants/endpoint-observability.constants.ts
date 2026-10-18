export const ENDPOINT_CACHE_MS = 5_000;
export const ENDPOINT_STALE_MS = 35_000;
export const ENDPOINT_FALLBACK_MS = 60_000;
export const ENDPOINT_REFRESH_MS = 10_000;
export const ENDPOINT_QUERY_TIMEOUT_MS = 1_500;
export const ENDPOINT_MAX_SAMPLES = 10_000;

const selector = '{job="app-backend"}';
const labels = 'instance,module,method,route';
const counter = 'interbank_app_endpoint_requests_total';
export const ENDPOINT_QUERIES = {
  catalog: `interbank_app_endpoint_info${selector} or (last_over_time(interbank_app_endpoint_info${selector}[1h]) and on(instance) (up${selector} == 0))`,
  up: `up${selector}`,
  scrapedAt: `timestamp(up${selector})`,
  total: `sum by (${labels}) (${counter}${selector})`,
  rate: `sum by (${labels}) (rate(${counter}${selector}[2m]))`,
  clientErrors: `sum by (${labels}) (rate(${counter}{job="app-backend",status_class="4xx"}[2m]))`,
  serverErrors: `sum by (${labels}) (rate(${counter}{job="app-backend",status_class="5xx"}[2m]))`,
  p95: `histogram_quantile(0.95, sum by (${labels},le) (rate(interbank_app_endpoint_request_duration_seconds_bucket${selector}[2m])))`,
} as const;
