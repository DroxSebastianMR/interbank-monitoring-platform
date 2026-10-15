import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AssistantMessage } from '@/features/assistant/components/assistant-message';
import { AssistantTypingIndicator } from '@/features/assistant/components/assistant-typing-indicator';
import type { AssistantMessage as AssistantMessageType } from '@/features/assistant/types/assistant.types';

const baseMessage: AssistantMessageType = {
  id: 'reply-1',
  role: 'assistant',
  content: '¡Hola! Puedo ayudarte con el monitor.',
  provider: 'deterministic',
  evidence: { asOf: '2026-10-15T10:00:00Z', serviceIds: [] },
  feedback: null,
  createdAt: '2026-10-15T10:00:00Z',
};

describe('AssistantMessage', () => {
  it('labels a greeting as guidance rather than an evidence summary', () => {
    render(<AssistantMessage message={baseMessage} />);

    expect(screen.getByText('Orientación del asistente')).toBeInTheDocument();
    expect(screen.queryByText(/Datos al/)).not.toBeInTheDocument();
  });

  it('identifies an AI response and the observed evidence time', () => {
    render(<AssistantMessage message={{
      ...baseMessage,
      provider: 'openrouter',
      evidence: { asOf: '2026-10-15T10:00:00Z', serviceIds: ['login'] },
    }} />);

    expect(screen.getByText('Respuesta con IA')).toBeInTheDocument();
    expect(screen.getByText(/Datos al/)).toBeInTheDocument();
  });

  it('announces when the assistant is preparing a response', () => {
    render(<AssistantTypingIndicator />);

    expect(screen.getByRole('status', { name: /preparando una respuesta/ })).toBeInTheDocument();
  });
});
