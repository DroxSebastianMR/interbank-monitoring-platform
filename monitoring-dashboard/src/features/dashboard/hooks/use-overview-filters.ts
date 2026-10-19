import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { OVERVIEW_PERIODS } from "@/features/dashboard/types/overview-filters.types";
import type {
  OverviewFilters,
  OverviewPeriod,
} from "@/features/dashboard/types/overview-filters.types";

export function useOverviewFilters() {
  const [params, setParams] = useSearchParams();
  const rawPeriod = params.get("period");
  const period: OverviewPeriod =
    OVERVIEW_PERIODS.find((item) => item.value === rawPeriod)?.value ?? "1h";
  const rawService = params.get("service") ?? "";
  const serviceId = /^[a-z][a-z0-9-]{1,59}$/.test(rawService) ? rawService : "";

  useEffect(() => {
    if ((!rawPeriod || rawPeriod === period) && rawService === serviceId)
      return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (rawPeriod) next.set("period", period);
        if (!serviceId) next.delete("service");
        return next;
      },
      { replace: true },
    );
  }, [rawPeriod, rawService, period, serviceId, setParams]);

  const update = (field: keyof OverviewFilters, value: string) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      const key = field === "serviceId" ? "service" : "period";
      ["observationFrom", "observationTo", "observationService"].forEach(
        (name) => next.delete(name),
      );
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    });
  };

  return {
    filters: { period, serviceId },
    setPeriod: (value: OverviewPeriod) => update("period", value),
    setService: (value: string) => update("serviceId", value),
  };
}
