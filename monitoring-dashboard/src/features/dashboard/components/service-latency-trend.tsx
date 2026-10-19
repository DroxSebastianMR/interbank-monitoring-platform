import { memo, useId } from "react";
import type { MetricSeries } from "@/features/dashboard/types/dashboard.types";
import { serviceObservationTime } from "@/features/dashboard/utils/service-observation";

export const ServiceLatencyTrend = memo(function ServiceLatencyTrend({
  name,
  points,
  from,
  to,
}: {
  name: string;
  points: MetricSeries["points"];
  from: number;
  to: number;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const sorted = [...points].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );
  const distinct = [
    ...new Map(sorted.map((point) => [point.timestamp, point])).values(),
  ];
  if (
    distinct.length < 2 ||
    Date.parse(distinct[0].timestamp) ===
      Date.parse(distinct[distinct.length - 1].timestamp)
  ) {
    return (
      <p className="service-state-note">
        {name}: no hay suficientes observaciones para mostrar una tendencia.
      </p>
    );
  }
  const max = Math.max(...distinct.map((point) => point.value), 1);
  const x = (time: number) => 52 + ((time - from) / (to - from)) * 604;
  const y = (value: number) => 112 - (value / max) * 88;
  const gap = Math.max(30_000, (to - from) * 0.1);
  const segments: (typeof distinct)[] = [];
  distinct.forEach((point, index) => {
    if (
      !index ||
      Date.parse(point.timestamp) - Date.parse(distinct[index - 1].timestamp) >
        gap
    )
      segments.push([]);
    segments[segments.length - 1].push(point);
  });
  return (
    <figure className="service-latency-trend">
      <figcaption>
        {name} · {distinct.length.toLocaleString("es-PE")} muestras · ms
      </figcaption>
      <svg
        viewBox="0 0 680 154"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>Latencia de sondas: {name}</title>
        <desc id={descriptionId}>
          Tiempo de respuesta en milisegundos, de{" "}
          {serviceObservationTime(new Date(from).toISOString())} a{" "}
          {serviceObservationTime(new Date(to).toISOString())} PET. Eje vertical
          desde cero hasta {Math.ceil(max)} ms. Los huecos sin datos no se
          conectan.
        </desc>
        {[0, 0.5, 1].map((ratio) => (
          <g key={ratio}>
            <line
              x1="52"
              x2="656"
              y1={y(max * ratio)}
              y2={y(max * ratio)}
              className="service-trend-grid"
            />
            <text x="45" y={y(max * ratio) + 4} textAnchor="end">
              {(max * ratio).toLocaleString("es-PE", {
                maximumFractionDigits: 1,
              })}
            </text>
          </g>
        ))}
        {segments.map((segment, index) =>
          segment.length > 1 ? (
            <polyline
              key={index}
              points={segment
                .map(
                  (point) =>
                    `${x(Date.parse(point.timestamp))},${y(point.value)}`,
                )
                .join(" ")}
              className="service-trend-line"
            />
          ) : (
            <circle
              key={index}
              cx={x(Date.parse(segment[0].timestamp))}
              cy={y(segment[0].value)}
              r="2.5"
              className="service-trend-point"
            />
          ),
        )}
        <text x="52" y="138">
          {serviceObservationTime(new Date(from).toISOString())}
        </text>
        <text x="656" y="138" textAnchor="end">
          {serviceObservationTime(new Date(to).toISOString())} PET
        </text>
      </svg>
      <details className="service-trend-samples">
        <summary>Consultar timestamps y valores</summary>
        <div className="service-trend-sample-scroll">
          <table>
            <caption>Observaciones persistidas de {name}</caption>
            <thead>
              <tr>
                <th scope="col">Comprobación (PET)</th>
                <th scope="col">Latencia de sonda</th>
              </tr>
            </thead>
            <tbody>
              {distinct.map((point) => (
                <tr key={point.timestamp}>
                  <td>
                    <time dateTime={point.timestamp}>
                      {serviceObservationTime(point.timestamp)}
                    </time>
                  </td>
                  <td>{point.value.toLocaleString("es-PE")} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
});
