import { apiClient, apiGet, apiPost } from '@/infrastructure/api/client/axios.instance';
import { API_ENDPOINTS } from '@/infrastructure/api/endpoints';
import type { AssistantConversation, AssistantMessage, AssistantReply } from '@/features/assistant/types/assistant.types';

export const assistantService = {
  conversations: (): Promise<AssistantConversation[]> => apiGet(API_ENDPOINTS.ASSISTANT.CONVERSATIONS),
  create: (): Promise<AssistantConversation> => apiPost(API_ENDPOINTS.ASSISTANT.CONVERSATIONS, {}),
  messages: (id: string): Promise<AssistantMessage[]> => apiGet(API_ENDPOINTS.ASSISTANT.MESSAGES(id)),
  send: async (id: string, content: string): Promise<AssistantReply> =>
    (await apiClient.post<AssistantReply>(API_ENDPOINTS.ASSISTANT.MESSAGES(id), { content }, { timeout: 20_000 })).data,
  remove: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.ASSISTANT.CONVERSATION(id));
  },
  feedback: (id: string, value: 'HELPFUL' | 'NOT_HELPFUL') =>
    apiPost(API_ENDPOINTS.ASSISTANT.FEEDBACK(id), { value }),
};
