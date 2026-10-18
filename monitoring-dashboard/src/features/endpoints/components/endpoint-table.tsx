import {
  TelemetryState,
  EndpointTrafficState,
} from "@/features/endpoints/enums/endpoint-state.enum";
import { TelemetryBadge } from "@/features/endpoints/components/telemetry-badge";
import type { EndpointMetric } from "@/features/endpoints/types/endpoint.types";
import {
  errorPercent,
  metricNumber,
} from "@/features/endpoints/utils/endpoint-metrics";

const trafficLabels: Record<EndpointTrafficState, string> = {
  OBSERVED: "Tráfico observado",
  NO_TRAFFIC: "Sin tráfico en la ventana",
  WARMING_UP: "Calculando tasa",
  NOT_MEASURED: "Scrape excluido del tráfico",
  UNKNOWN: "Sin medición actual",
};

export function EndpointTable({ endpoints }: { endpoints: EndpointMetric[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">
          Operaciones declaradas y métricas por instancia. La disponibilidad del
          scrape no garantiza el éxito de cada operación.
        </caption>
        <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
          <tr>
            {[
              "Módulo / operación",
              "Instancia",
              "Telemetría / tráfico",
              "Solicitudes/s",
              "P95 (ms)",
              "Errores 5xx (%)",
              "Respuestas 4xx/s",
            ].map((heading) => (
              <th
                key={heading}
                scope="col"
                className="whitespace-nowrap px-4 py-3 font-semibold"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {endpoints.map((endpoint) => {
            const current = endpoint.state === TelemetryState.AVAILABLE;
            return (
              <tr
                key={`${endpoint.instance}:${endpoint.method}:${endpoint.route}`}
                className="align-top hover:bg-emerald-50/30"
              >
                <td className="min-w-64 px-4 py-4">
                  <div className="mb-1 text-xs text-slate-500">
                    {endpoint.module}
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-blue-800">
                      {endpoint.method}
                    </span>
                    <code className="break-all text-xs text-slate-800">
                      {endpoint.route}
                    </code>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600">
                  {endpoint.instance}
                </td>
                <td className="px-4 py-4">
                  <TelemetryBadge state={endpoint.state} />
                  <p className="mt-1.5 whitespace-nowrap text-xs text-slate-500">
                    {trafficLabels[endpoint.traffic]}
                  </p>
                </td>
                <td className="px-4 py-4 tabular-nums">
                  {metricNumber(current ? endpoint.requestRateHz : null, 3)}
                </td>
                <td className="px-4 py-4 tabular-nums">
                  {metricNumber(current ? endpoint.latencyP95Ms : null, 1)}
                </td>
                <td className="px-4 py-4 tabular-nums">
                  {metricNumber(errorPercent(endpoint))}
                </td>
                <td className="px-4 py-4 tabular-nums">
                  {metricNumber(current ? endpoint.clientErrorRateHz : null, 3)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {endpoints.length === 0 && (
        <p className="p-8 text-center text-sm text-slate-500">
          No hay operaciones para estos filtros.
        </p>
      )}
    </div>
  );
}
