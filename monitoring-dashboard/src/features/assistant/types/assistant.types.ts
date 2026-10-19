export interface AssistantConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider: string | null;
  evidence: { asOf?: string; serviceIds?: string[] } | null;
  feedback: 'HELPFUL' | 'NOT_HELPFUL' | null;
  createdAt: string;
}

export interface AssistantReply {
  userMessage: AssistantMessage;
  assistantMessage: AssistantMessage;
  answer: {
    provider: string;
    asOf: string;
    evidenceServiceIds: string[];
  };
  run: { id: string; latencyMs: number; model: string | null };
}
