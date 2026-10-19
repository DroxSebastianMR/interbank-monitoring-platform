import type { ServiceStateChange } from "@/features/services/types/service.types";
export interface HistoricalEvent {
  id: string;
  serviceId: string | null;
  type: "STATE_CHANGE" | "INCIDENT_OPENED" | "RECOVERY" | "IMPORTANT_ALERT";
  typeLabel: string;
  timestamp: string;
  description: string;
  status: string;
  href: string;
  permission: string;
}
export interface StateHistorySource {
  serviceId: string;
  data?: ServiceStateChange[];
  isError: boolean;
  isPending: boolean;
  isPaused: boolean;
  updatedAt: number;
}
