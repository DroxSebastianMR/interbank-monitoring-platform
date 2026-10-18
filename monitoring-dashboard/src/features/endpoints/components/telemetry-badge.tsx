import { TelemetryState } from "@/features/endpoints/enums/endpoint-state.enum";

const states: Record<TelemetryState, { label: string; color: string }> = {
  AVAILABLE: {
    label: "Scrape activo",
    color: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  UNAVAILABLE: {
    label: "Sin respuesta al scrape",
    color: "border-red-200 bg-red-50 text-red-800",
  },
  STALE: {
    label: "Datos antiguos",
    color: "border-amber-200 bg-amber-50 text-amber-800",
  },
  UNKNOWN: {
    label: "Sin telemetría",
    color: "border-slate-200 bg-slate-50 text-slate-600",
  },
};

export function TelemetryBadge({ state }: { state: TelemetryState }) {
  const { label, color } = states[state] ?? states.UNKNOWN;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${color}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
