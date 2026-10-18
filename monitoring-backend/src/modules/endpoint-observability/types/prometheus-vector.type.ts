export interface PrometheusSample {
  metric: Record<string, string>;
  value: [number, string];
}
