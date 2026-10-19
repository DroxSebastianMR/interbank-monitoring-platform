import { useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/app/providers/auth/use-auth";
import { PermissionCode } from "@/features/auth/enums/permission-code.enum";
import { useOverview } from "@/features/dashboard/hooks/use-overview";
import { useBrowserOnline } from "@/features/dashboard/hooks/use-browser-online";
import {
  monitoringAccessDenied,
  monitoringPoll,
  retryMonitoringQuery,
} from "@/features/dashboard/utils/dashboard-data-state";
import type { MonitoringSource } from "@/features/dashboard/types/monitoring-source.types";
import { dashboardService } from "@/features/dashboard/services/dashboard.service";
import { useEndpoints } from "@/features/endpoints/hooks/use-endpoints";
import { servicesService } from "@/features/services/services/services.service";
import { incidentsService } from "@/features/incidents/services/incidents.service";
import {
  OVERVIEW_PERIODS,
  OVERVIEW_POLL_INTERVAL_MS,
} from "@/features/dashboard/types/overview-filters.types";
import type { OverviewFilters } from "@/features/dashboard/types/overview-filters.types";

export function useDashboardQueries(filters: OverviewFilters) {
  const { employee } = useAuth();
  const online = useBrowserOnline();
  const overviewAllowed =
    employee?.permissions.includes(PermissionCode.DASHBOARD_READ) ?? false;
  const scope = `${employee?.id ?? ""}:${employee?.permissions.join(",") ?? ""}`;
  const overview = useOverview(scope, overviewAllowed);
  const canReadOverview =
    overviewAllowed && !monitoringAccessDenied(overview.error);
  const canReadMetrics =
    canReadOverview &&
    (employee?.permissions.includes(PermissionCode.ANALYTICS_READ) ?? false);
  const canReadServices =
    canReadOverview &&
    (employee?.permissions.includes(PermissionCode.SERVICES_READ) ?? false);
  const serviceObservations = useQuery({
    queryKey: ["dashboard-service-observations", scope],
    queryFn: servicesService.list,
    enabled: canReadServices,
    refetchInterval: (query: { state: { error: unknown } }) =>
      monitoringPoll(query.state.error),
    retry: retryMonitoringQuery,
  });
  const canReadEndpoints = canReadMetrics;
  const endpoints = useEndpoints(
    employee?.id,
    canReadEndpoints,
    OVERVIEW_POLL_INTERVAL_MS,
  );
  const selectedServiceExists =
    !filters.serviceId ||
    !!overview.data?.services.some((item) => item.id === filters.serviceId);
  const metrics = useQuery({
    queryKey: [
      "dashboard-metrics",
      "latency",
      scope,
      filters.period,
      filters.serviceId,
    ],
    queryFn: ({ signal }) => {
      const to = new Date();
      const duration = OVERVIEW_PERIODS.find(
        (item) => item.value === filters.period,
      )!.durationMs;
      return dashboardService.metrics(
        "latency",
        {
          from: new Date(to.getTime() - duration).toISOString(),
          to: to.toISOString(),
          serviceId: filters.serviceId || undefined,
        },
        signal,
      );
    },
    enabled: canReadMetrics && selectedServiceExists,
    refetchInterval: (query: { state: { error: unknown } }) =>
      monitoringPoll(query.state.error),
    retry: retryMonitoringQuery,
  });
  const availability = useQuery({
    queryKey: [
      "dashboard-metrics",
      "availability",
      scope,
      filters.period,
      filters.serviceId,
    ],
    queryFn: ({ signal }) => {
      const to = new Date();
      const duration = OVERVIEW_PERIODS.find(
        (item) => item.value === filters.period,
      )!.durationMs;
      return dashboardService.metrics(
        "availability",
        {
          from: new Date(to.getTime() - duration).toISOString(),
          to: to.toISOString(),
          serviceId: filters.serviceId || undefined,
        },
        signal,
      );
    },
    enabled: canReadMetrics && selectedServiceExists,
    refetchInterval: (query: { state: { error: unknown } }) =>
      monitoringPoll(query.state.error),
    retry: retryMonitoringQuery,
  });
  const canReadIncidents =
    canReadOverview &&
    (employee?.permissions.includes("incidents.read") ?? false);
  const attentionIncidents = useQuery({
    queryKey: ["dashboard-attention-incidents", scope],
    queryFn: incidentsService.list,
    enabled: canReadIncidents,
    refetchInterval: (query: { state: { error: unknown } }) =>
      monitoringPoll(query.state.error),
    retry: retryMonitoringQuery,
  });
  const canReadAlerts =
    canReadOverview && (employee?.permissions.includes("alerts.read") ?? false);
  const historicalAlerts = useQuery({
    queryKey: ["dashboard-historical-alerts", scope],
    queryFn: incidentsService.alerts,
    enabled: canReadAlerts,
    refetchInterval: (query: { state: { error: unknown } }) =>
      monitoringPoll(query.state.error),
    retry: retryMonitoringQuery,
  });
  const historyServices =
    overview.data?.services.filter(
      (service) => !filters.serviceId || service.id === filters.serviceId,
    ) ?? [];
  const stateQueries = useQueries({
    queries: historyServices.map((service) => ({
      queryKey: ["dashboard-state-history", scope, service.id, filters.period],
      queryFn: () => servicesService.stateHistory(service.id),
      enabled: canReadServices,
      refetchInterval: (query: { state: { error: unknown } }) =>
        monitoringPoll(query.state.error),
      retry: retryMonitoringQuery,
    })),
  });
  const topology = useQuery({
    queryKey: ["dashboard-topology", scope],
    queryFn: ({ signal }) => dashboardService.topology(signal),
    enabled: canReadOverview,
    refetchInterval: (query: { state: { error: unknown } }) =>
      monitoringPoll(query.state.error),
    retry: retryMonitoringQuery,
    staleTime: OVERVIEW_POLL_INTERVAL_MS / 2,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState({ selection: "", message: "" });
  const refreshingRef = useRef(false);
  // Feedback belongs to the selection that requested the refresh.
  const selection = `${scope}:${filters.period}:${filters.serviceId}`;

  const refresh = async () => {
    if (!overviewAllowed || refreshingRef.current) return;
    if (!navigator.onLine) {
      setFeedback({
        selection,
        message: "Sin conexión. La última información recibida se conserva.",
      });
      return;
    }
    refreshingRef.current = true;
    setRefreshing(true);
    setFeedback({
      selection,
      message: "Actualizando la información operativa…",
    });
    try {
      const queries: Array<Promise<{ isError: boolean }>> = [
        overview.refetch({ cancelRefetch: false }),
      ];
      if (canReadOverview)
        queries.push(topology.refetch({ cancelRefetch: false }));
      if (canReadMetrics && selectedServiceExists)
        queries.push(
          metrics.refetch({ cancelRefetch: false }),
          availability.refetch({ cancelRefetch: false }),
        );
      if (canReadEndpoints)
        queries.push(endpoints.refetch({ cancelRefetch: false }));
      if (canReadServices)
        queries.push(serviceObservations.refetch({ cancelRefetch: false }));
      if (canReadIncidents)
        queries.push(attentionIncidents.refetch({ cancelRefetch: false }));
      if (canReadAlerts)
        queries.push(historicalAlerts.refetch({ cancelRefetch: false }));
      if (canReadServices)
        stateQueries.forEach((query) =>
          queries.push(query.refetch({ cancelRefetch: false })),
        );
      const results = await Promise.allSettled(queries);
      const failed = results.filter(
        (result) => result.status === "rejected" || result.value.isError,
      ).length;
      setFeedback({
        selection,
        message:
          failed === 0
            ? "Información operativa actualizada."
            : failed === results.length
              ? "No se pudo actualizar. Se conserva la última información recibida."
              : "Actualización parcial. Algunas fuentes no respondieron.",
      });
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  };

  const source = (
    id: string,
    label: string,
    allowed: boolean,
    query: {
      data: unknown;
      error: unknown;
      isPending: boolean;
      isPaused: boolean;
      isFetching: boolean;
      dataUpdatedAt: number;
    },
    observedAt?: string | null,
  ): MonitoringSource => ({
    id,
    label,
    allowed,
    hasData: query.data !== undefined,
    error: query.error,
    isPending: query.isPending,
    isPaused: query.isPaused,
    isFetching: query.isFetching,
    updatedAt: query.dataUpdatedAt,
    observedAt,
  });
  const sources = [
    source(
      "overview",
      "Resumen",
      overviewAllowed,
      overview,
      overview.data?.generatedAt,
    ),
    source(
      "latency",
      "Latencia de sondas",
      canReadMetrics && selectedServiceExists,
      metrics,
      metrics.data?.to,
    ),
    source(
      "availability",
      "Disponibilidad de sondas",
      canReadMetrics && selectedServiceExists,
      availability,
      availability.data?.to,
    ),
    source(
      "services",
      "Catálogo de servicios",
      canReadServices,
      serviceObservations,
    ),
    source("incidents", "Incidentes", canReadIncidents, attentionIncidents),
    source("alerts", "Alertas históricas", canReadAlerts, historicalAlerts),
    source(
      "endpoints",
      "Telemetría HTTP",
      canReadEndpoints,
      endpoints,
      endpoints.data?.generatedAt,
    ),
    source("topology", "Infraestructura", canReadOverview, topology),
    ...stateQueries.map((query, index) =>
      source(
        `history:${historyServices[index].id}`,
        `Cambios de ${historyServices[index].name}`,
        canReadServices,
        query,
      ),
    ),
  ];
  return {
    online,
    overviewAllowed,
    sources,
    overview,
    serviceObservations: monitoringAccessDenied(serviceObservations.error)
      ? { ...serviceObservations, data: undefined }
      : serviceObservations,
    canReadServices,
    metrics: monitoringAccessDenied(metrics.error)
      ? { ...metrics, data: undefined }
      : metrics,
    availability: monitoringAccessDenied(availability.error)
      ? { ...availability, data: undefined }
      : availability,
    endpoints: monitoringAccessDenied(endpoints.error)
      ? { ...endpoints, data: undefined }
      : endpoints,
    canReadEndpoints,
    attentionIncidents: monitoringAccessDenied(attentionIncidents.error)
      ? { ...attentionIncidents, data: undefined }
      : attentionIncidents,
    canReadIncidents,
    historicalAlerts: monitoringAccessDenied(historicalAlerts.error)
      ? { ...historicalAlerts, data: undefined }
      : historicalAlerts,
    canReadAlerts,
    stateHistories: stateQueries.map((query, index) => ({
      serviceId: historyServices[index].id,
      data: monitoringAccessDenied(query.error) ? undefined : query.data,
      isError: query.isError,
      isPending: query.isPending,
      isPaused: query.isPaused,
      updatedAt: query.dataUpdatedAt,
    })),
    topology: monitoringAccessDenied(topology.error)
      ? { ...topology, data: undefined }
      : topology,
    canReadOverview,
    canReadMetrics,
    selectedServiceExists,
    refreshing,
    isFetching:
      overview.isFetching ||
      (canReadServices && serviceObservations.isFetching) ||
      (canReadIncidents && attentionIncidents.isFetching) ||
      (canReadAlerts && historicalAlerts.isFetching) ||
      (canReadServices && stateQueries.some((query) => query.isFetching)) ||
      topology.isFetching ||
      (canReadMetrics && (metrics.isFetching || availability.isFetching)) ||
      (canReadEndpoints && endpoints.isFetching),
    refreshMessage: feedback.selection === selection ? feedback.message : "",
    refresh,
  };
}
