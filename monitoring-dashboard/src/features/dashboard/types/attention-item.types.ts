export interface AttentionItem {
  id: string;
  type: "INCIDENT" | "ALERT" | "MONITORING";
  serviceId: string;
  description: string;
  severity: string | null;
  attentionState:
    | "PENDING"
    | "OPEN"
    | "IN_PROGRESS"
    | "ACKNOWLEDGED"
    | "REVIEW_REQUIRED"
    | "UNKNOWN";
  attentionLabel: string;
  relevantAt: string | null;
  observationMissing: boolean;
  action: { label: string; href: string; permission: string };
}
