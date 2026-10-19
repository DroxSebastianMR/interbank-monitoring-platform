export const OVERVIEW_PERIODS = [
  { value: "15m", label: "15 min", durationMs: 15 * 60_000 },
  { value: "1h", label: "1 h", durationMs: 60 * 60_000 },
  { value: "6h", label: "6 h", durationMs: 6 * 60 * 60_000 },
  { value: "24h", label: "24 h", durationMs: 24 * 60 * 60_000 },
] as const;

export type OverviewPeriod = (typeof OVERVIEW_PERIODS)[number]["value"];

export interface OverviewFilters {
  period: OverviewPeriod;
  serviceId: string;
}

export const OVERVIEW_POLL_INTERVAL_MS = 10_000;
