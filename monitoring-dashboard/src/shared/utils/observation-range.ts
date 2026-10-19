export function readObservationRange(params: URLSearchParams) {
  const from = params.get("observationFrom");
  const to = params.get("observationTo");
  if (!from || !to) return undefined;
  const left = Date.parse(from);
  const right = Date.parse(to);
  return Number.isFinite(left) &&
    Number.isFinite(right) &&
    right > left &&
    right - left <= 86_400_000
    ? { from, to }
    : undefined;
}
