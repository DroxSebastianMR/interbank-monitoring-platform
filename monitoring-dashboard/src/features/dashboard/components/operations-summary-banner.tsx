import { useEffect, useState } from "react";
import {
  ArrowRight,
  CircleCheck,
  CircleDashed,
  CircleX,
  RefreshCw,
  TriangleAlert,
  WifiOff,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { DashboardOverview } from "@/features/dashboard/types/dashboard.types";
import { getOverviewAttention } from "@/features/dashboard/utils/overview-attention";
import "./operations-summary-banner.css";

interface OperationsSummaryBannerProps {
  overview?: DashboardOverview;
  disconnected?: boolean;
  isFetching: boolean;
  onRefresh: () => void;
}

const ICONS = {
  operational: CircleCheck,
  degraded: TriangleAlert,
  unavailable: CircleX,
  "no-data": CircleDashed,
  disconnected: WifiOff,
  incident: TriangleAlert,
};

export function OperationsSummaryBanner({
  overview,
  disconnected = false,
  isFetching,
  onRefresh,
}: OperationsSummaryBannerProps) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const attention = getOverviewAttention(
    overview,
    disconnected,
    Math.max(now, Date.now()),
  );
  const Icon = ICONS[attention.condition];
  return (
    <section
      className={`overview-attention overview-attention--${attention.condition}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <Icon className="overview-attention__icon" aria-hidden="true" />
      <p>{attention.message}</p>
      {attention.condition === "disconnected" ? (
        <button type="button" onClick={onRefresh} disabled={isFetching}>
          <RefreshCw aria-hidden="true" className={isFetching ? "spin" : ""} />
          {isFetching ? "Reintentando…" : "Reintentar"}
        </button>
      ) : attention.action ? (
        <Link to={attention.action.href}>
          {attention.action.label}
          <ArrowRight aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}
