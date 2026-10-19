import { useEffect, useId, useState } from "react";
import type {
  PerformanceBucket,
  PerformanceLine,
} from "@/features/dashboard/utils/performance-series";
import {
  OBSERVED_SERVICE_NAMES,
  serviceObservationTime,
} from "@/features/dashboard/utils/service-observation";

export interface TimelineIncident {
  id: string;
  serviceId: string;
  openedAt: string;
}
interface Props {
  from: number;
  to: number;
  lines: PerformanceLine[];
  incidents: TimelineIncident[];
  onSelect: (serviceId: string, bucket: PerformanceBucket) => void;
  selected?: { serviceId: string; from: string; to: string };
}
const STYLES: Record<string, { color: string; dash: string }> = {
  login: { color: "#2b6aa1", dash: "" },
  balance: { color: "#18835a", dash: "6 3" },
  transfers: { color: "#7955a2", dash: "2 3" },
};
const lineStyle = (id: string) =>
  STYLES[id] ?? { color: "#586776", dash: "8 3 2 3" };
const clock = (time: number) =>
  new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Lima",
  }).format(time);

export function PerformanceTimeline({
  from,
  to,
  lines,
  incidents,
  onSelect,
  selected,
}: Props) {
  const titleId = useId();
  const tooltipId = useId();
  const [hovered, setHover] = useState<{
    serviceId: string;
    bucket: PerformanceBucket;
  } | null>(null);
  const hoveredBucket = hovered
    ? lines
        .find((line) => line.serviceId === hovered.serviceId)
        ?.buckets.find(
          (bucket) =>
            bucket.from === hovered.bucket.from && bucket.value !== null,
        )
    : undefined;
  const hover =
    hovered && hoveredBucket
      ? { serviceId: hovered.serviceId, bucket: hoveredBucket }
      : null;
  useEffect(() => {
    if (!hover) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHover(null);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [hover]);
  const values = lines.flatMap((line) =>
    line.buckets.flatMap((bucket) =>
      bucket.value === null ? [] : [bucket.value],
    ),
  );
  if (!values.length)
    return (
      <p className="performance-empty">
        {lines.every((line) => line.buckets.every((bucket) => bucket.missing))
          ? "No hay observaciones de sondas para este periodo."
          : "No hay intervalos con muestras suficientes y completas para calcular p95."}
      </p>
    );
  const max = Math.max(1, Math.ceil(Math.max(...values) / 10) * 10);
  const x = (time: number) => 70 + ((time - from) / (to - from)) * 890;
  const y = (value: number) => 220 - (value / max) * 180;
  const markers = incidents.slice(0, 12);
  const gaps = lines[0].buckets.filter((_, index) =>
    lines.every((line) => line.buckets[index].value === null),
  );
  return (
    <>
      <ul className="performance-legend" aria-label="Leyenda del gráfico">
        {lines.map((line) => (
          <li key={line.serviceId}>
            <svg width="24" height="10" aria-hidden="true">
              <line
                x1="0"
                x2="24"
                y1="5"
                y2="5"
                stroke={lineStyle(line.serviceId).color}
                strokeDasharray={lineStyle(line.serviceId).dash}
                strokeWidth="2"
              />
            </svg>
            {OBSERVED_SERVICE_NAMES[line.serviceId] ?? line.serviceId}
          </li>
        ))}
        <li>
          <span className="performance-gap-key" aria-hidden="true" />
          Sin observaciones
        </li>
        <li>
          <span className="performance-insufficient-key" aria-hidden="true" />
          Muestras insuficientes
        </li>
        {markers.length ? (
          <li>
            <span aria-hidden="true">◆</span>Apertura de incidente
          </li>
        ) : null}
      </ul>
      <div className="performance-chart-scroll">
        <div className="performance-chart" onMouseLeave={() => setHover(null)}>
          <svg viewBox="0 0 1000 275" role="group" aria-labelledby={titleId}>
            <title id={titleId}>
              Evolución temporal de latencia p95 de sondas, en milisegundos. Los
              intervalos sin p95 no se conectan. Selecciona un punto para
              revisar su intervalo.
            </title>
            {gaps.map((bucket) => (
              <rect
                key={bucket.from}
                x={x(bucket.from)}
                y="35"
                width={Math.max(0, x(bucket.to) - x(bucket.from))}
                height="185"
                className={
                  lines.every(
                    (line) =>
                      line.buckets.find((item) => item.from === bucket.from)
                        ?.missing,
                  )
                    ? "performance-gap"
                    : "performance-insufficient"
                }
              />
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <g key={ratio}>
                <line
                  x1="70"
                  x2="960"
                  y1={y(max * ratio)}
                  y2={y(max * ratio)}
                  className="performance-grid"
                />
                <text x="60" y={y(max * ratio) + 4} textAnchor="end">
                  {(max * ratio).toLocaleString("es-PE", {
                    maximumFractionDigits: 1,
                  })}
                </text>
              </g>
            ))}
            <text x="70" y="22">
              Latencia p95 (ms) · sondas
            </text>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <text
                key={ratio}
                x={x(from + (to - from) * ratio)}
                y="242"
                textAnchor={
                  ratio === 0 ? "start" : ratio === 1 ? "end" : "middle"
                }
              >
                {clock(from + (to - from) * ratio)}
              </text>
            ))}
            <text x="960" y="264" textAnchor="end">
              Hora de Lima · PET
            </text>
            {markers.map((incident) => (
              <g key={incident.id}>
                <title>
                  Apertura de incidente de{" "}
                  {OBSERVED_SERVICE_NAMES[incident.serviceId] ??
                    incident.serviceId}
                  : {serviceObservationTime(incident.openedAt)} PET. Referencia{" "}
                  {incident.id}.
                </title>
                <line
                  x1={x(Date.parse(incident.openedAt))}
                  x2={x(Date.parse(incident.openedAt))}
                  y1="32"
                  y2="220"
                  className="performance-incident-line"
                />
                <text
                  x={x(Date.parse(incident.openedAt))}
                  y="30"
                  textAnchor="middle"
                  className="performance-incident-symbol"
                >
                  ◆
                </text>
              </g>
            ))}
            {lines.map((line) => {
              const segments: PerformanceBucket[][] = [];
              line.buckets.forEach((bucket, index) => {
                if (bucket.value === null) return;
                if (!index || line.buckets[index - 1].value === null)
                  segments.push([]);
                segments[segments.length - 1].push(bucket);
              });
              const style = lineStyle(line.serviceId);
              return (
                <g key={line.serviceId}>
                  {segments
                    .filter((segment) => segment.length > 1)
                    .map((segment) => (
                      <polyline
                        key={segment[0].from}
                        points={segment
                          .map(
                            (bucket) => `${x(bucket.at)},${y(bucket.value!)}`,
                          )
                          .join(" ")}
                        fill="none"
                        stroke={style.color}
                        strokeDasharray={style.dash}
                        strokeWidth="2"
                      />
                    ))}
                  {line.buckets
                    .filter((bucket) => bucket.value !== null)
                    .map((bucket) => {
                      const active =
                        selected?.serviceId === line.serviceId &&
                        Date.parse(selected.from) >= bucket.from &&
                        Date.parse(selected.to) <= bucket.to;
                      return (
                        <circle
                          key={bucket.from}
                          cx={x(bucket.at)}
                          cy={y(bucket.value!)}
                          r={active ? 6 : 4}
                          fill={style.color}
                          stroke={active ? "#172e22" : "#fff"}
                          strokeWidth="2"
                          tabIndex={0}
                          role="button"
                          aria-label={`${OBSERVED_SERVICE_NAMES[line.serviceId] ?? line.serviceId}: p95 ${bucket.value!.toLocaleString("es-PE")} ms, ${serviceObservationTime(new Date(bucket.from).toISOString())} a ${serviceObservationTime(new Date(bucket.to).toISOString())} PET. ${bucket.count} sondas persistidas. Seleccionar intervalo.`}
                          aria-describedby={
                            hover?.serviceId === line.serviceId &&
                            hover.bucket.from === bucket.from
                              ? tooltipId
                              : undefined
                          }
                          onMouseEnter={() =>
                            setHover({ serviceId: line.serviceId, bucket })
                          }
                          onFocus={() =>
                            setHover({ serviceId: line.serviceId, bucket })
                          }
                          onBlur={() => setHover(null)}
                          onClick={() => {
                            setHover({ serviceId: line.serviceId, bucket });
                            onSelect(line.serviceId, bucket);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setHover(null);
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onSelect(line.serviceId, bucket);
                            }
                          }}
                        />
                      );
                    })}
                </g>
              );
            })}
          </svg>
          {hover ? (
            <div
              className="performance-tooltip"
              role="tooltip"
              id={tooltipId}
              style={{
                left: `${Math.min(54, Math.max(0, x(hover.bucket.at) / 10))}%`,
              }}
            >
              <strong>
                {OBSERVED_SERVICE_NAMES[hover.serviceId] ?? hover.serviceId} ·{" "}
                {hover.bucket.value?.toLocaleString("es-PE")} ms
              </strong>
              <span>
                p95 · {hover.bucket.count} muestras de sondas persistidas
              </span>
              <span>
                {serviceObservationTime(
                  new Date(hover.bucket.from).toISOString(),
                )}{" "}
                a{" "}
                {serviceObservationTime(
                  new Date(hover.bucket.to).toISOString(),
                )}{" "}
                PET
              </span>
            </div>
          ) : null}
        </div>
      </div>
      <details className="performance-values">
        <summary>Consultar valores y datos ausentes</summary>
        <div>
          <table>
            <caption>
              p95 por intervalo de sondas persistidas, no tráfico HTTP
            </caption>
            <thead>
              <tr>
                <th scope="col">Servicio</th>
                <th scope="col">Intervalo (PET)</th>
                <th scope="col">p95</th>
                <th scope="col">Muestras</th>
                <th scope="col">Cobertura</th>
              </tr>
            </thead>
            <tbody>
              {lines.flatMap((line) =>
                line.buckets.map((bucket) => (
                  <tr key={`${line.serviceId}:${bucket.from}`}>
                    <th scope="row">
                      {OBSERVED_SERVICE_NAMES[line.serviceId] ?? line.serviceId}
                    </th>
                    <td>
                      {serviceObservationTime(
                        new Date(bucket.from).toISOString(),
                      )}{" "}
                      –{" "}
                      {serviceObservationTime(
                        new Date(bucket.to).toISOString(),
                      )}
                    </td>
                    <td>
                      {bucket.value === null
                        ? "—"
                        : `${bucket.value.toLocaleString("es-PE")} ms`}
                    </td>
                    <td>{bucket.count}</td>
                    <td>
                      {bucket.missing
                        ? "Sin observaciones"
                        : bucket.partial
                          ? "Respuesta parcial"
                          : bucket.value === null
                            ? "Insuficiente"
                            : "Observado"}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </details>
      {incidents.length > markers.length ? (
        <p className="performance-note">
          Se muestran {markers.length} de {incidents.length} aperturas
          relacionadas en el gráfico; todas están en la lista de referencias.
        </p>
      ) : null}
    </>
  );
}
