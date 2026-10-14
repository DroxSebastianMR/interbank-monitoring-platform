export type AiRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AiModelMode = 'baseline' | 'isolation_forest';

export interface AiResult {
  anomaly: boolean;
  anomalyScore: number;
  riskLevel: AiRiskLevel;
  modelMode: AiModelMode;
}

export interface AiHealth {
  status: string;
  service: string;
  timestamp: string;
}

export interface WindowAnalysis {
  serviceId: string;
  status: 'OK' | 'INSUFFICIENT_DATA';
  anomalyScore: number;
  riskLevel: AiRiskLevel;
  modelMode: AiModelMode;
  reasons: string[];
}

export interface AssistantEvidence {
  question: string;
  asOf: string;
  services: Array<{
    id: string;
    name: string;
    status: string;
    lastCheckedAt: string | null;
    latencyMs: number | null;
  }>;
  incidents: Array<{ id: string; serviceId: string; title: string; status: string }>;
  metrics?: Array<{
    serviceId: string;
    requestRate: number;
    errorRate: number;
    latencyP95Ms: number;
  }>;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AssistantAnswer {
  answer: string;
  provider: 'deterministic' | 'openai' | 'gemini' | 'openrouter';
  asOf: string;
  evidenceServiceIds: string[];
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
}
