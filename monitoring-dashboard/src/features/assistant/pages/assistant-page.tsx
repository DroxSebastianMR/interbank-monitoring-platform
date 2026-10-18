import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/providers/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AssistantEmptyState } from '@/features/assistant/components/assistant-empty-state';
import { AssistantMessage } from '@/features/assistant/components/assistant-message';
import { AssistantTypingIndicator } from '@/features/assistant/components/assistant-typing-indicator';
import { assistantService } from '@/features/assistant/services/assistant.service';
import { PanelSkeleton } from '@/shared/components/loading/module-skeleton';

export function AssistantPage() {
  const { employee } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const canRead = employee?.permissions.includes('assistant.read') ?? false;
  const canAsk = employee?.permissions.includes('assistant.ask') ?? false;
  const conversations = useQuery({
    queryKey: ['assistant-conversations'],
    queryFn: assistantService.conversations,
    enabled: canRead,
  });
  const messages = useQuery({
    queryKey: ['assistant-messages', selectedId],
    queryFn: () => assistantService.messages(selectedId!),
    enabled: canRead && !!selectedId,
  });

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages.data, sending, selectedId]);

  function useSuggestion(question: string) {
    setDraft(question);
    inputRef.current?.focus();
  }

  async function newConversation() {
    if (sending) return;
    setError(null);
    try {
      const conversation = await assistantService.create();
      setSelectedId(conversation.id);
      setDraft('');
      await queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la conversación');
    }
  }

  async function send() {
    const content = draft.trim();
    if (content.length < 3 || sending || !canAsk) return;
    setError(null);
    setSending(true);
    try {
      let id = selectedId;
      if (!id) {
        const conversation = await assistantService.create();
        id = conversation.id;
        setSelectedId(id);
      }
      await assistantService.send(id, content);
      setDraft('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] }),
        queryClient.invalidateQueries({ queryKey: ['assistant-messages', id] }),
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo enviar la consulta');
    } finally {
      setSending(false);
    }
  }

  async function remove(id: string) {
    if (sending) return;
    try {
      await assistantService.remove(id);
      if (selectedId === id) setSelectedId(null);
      await queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la conversación');
    }
  }

  if (!canRead) {
    return <div className="notice" role="alert">No tienes permiso para consultar el asistente.</div>;
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Centro de monitoreo</p>
          <h2 className="text-2xl font-semibold text-slate-900">Asistente operativo</h2>
          <p className="mt-1 text-sm text-slate-500">Conversemos sobre tus servicios con respuestas basadas en datos observados.</p>
        </div>
        {canAsk && (
          <Button type="button" onClick={() => void newConversation()} disabled={sending} className="bg-emerald-700 text-white hover:bg-emerald-800">
            <Plus aria-hidden="true" /> Nueva conversación
          </Button>
        )}
      </div>

      <div className="grid min-h-[620px] overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm md:grid-cols-[250px_minmax(0,1fr)]">
        <aside aria-label="Historial de conversaciones" className="border-b border-emerald-100 bg-emerald-50/60 p-4 md:border-r md:border-b-0">
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900">Conversaciones</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-emerald-700">{conversations.data?.length ?? 0}</span>
          </div>
          {conversations.isLoading && <PanelSkeleton rows={5} label="Cargando historial de conversaciones" />}
          {conversations.isError && <p className="px-2 text-sm text-red-700">No se pudo cargar el historial.</p>}
          {conversations.data?.length === 0 && (
            <p className="rounded-xl border border-dashed border-emerald-200 bg-white/70 px-3 py-4 text-sm leading-5 text-slate-500">
              Tu primera conversación aparecerá aquí.
            </p>
          )}
          <div className="flex max-h-40 flex-col gap-1 overflow-auto md:max-h-[500px]">
            {conversations.data?.map((item) => (
              <div key={item.id} className={selectedId === item.id
                ? 'flex items-center rounded-xl border border-emerald-200 bg-white shadow-sm'
                : 'flex items-center rounded-xl border border-transparent hover:bg-white/80'}>
                <button type="button" disabled={sending} onClick={() => setSelectedId(item.id)} className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm font-medium text-slate-700 disabled:cursor-wait">
                  {item.title}
                </button>
                <button type="button" disabled={sending} onClick={() => void remove(item.id)} aria-label={'Eliminar ' + item.title} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-600 disabled:cursor-wait">
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-h-[600px] min-w-0 flex-col bg-gradient-to-b from-white via-white to-emerald-50/40">
          <div ref={messagesContainerRef} role="log" aria-label="Mensajes de la conversación" aria-live="polite" className="flex max-h-[580px] min-h-[400px] flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
            {!selectedId && <AssistantEmptyState canAsk={canAsk} onSuggestion={useSuggestion} />}
            {selectedId && messages.isLoading && <PanelSkeleton rows={4} label="Cargando mensajes" />}
            {selectedId && messages.isError && <p role="alert" className="m-auto text-sm text-red-700">No se pudieron cargar los mensajes.</p>}
            {selectedId && !messages.isLoading && messages.data?.length === 0 && !sending && (
              <AssistantEmptyState canAsk={canAsk} onSuggestion={useSuggestion} />
            )}
            {selectedId && messages.data?.map((message) => <AssistantMessage key={message.id} message={message} />)}
            {sending && <AssistantTypingIndicator />}
          </div>

          <div className="border-t border-emerald-100 bg-white p-4 sm:p-5">
            {error && <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <div className="flex items-end gap-2 rounded-2xl border border-emerald-200 bg-white p-2 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
              <Textarea
                ref={inputRef}
                aria-label="Pregunta para el asistente"
                placeholder="Escribe tu pregunta sobre el monitor…"
                maxLength={1000}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                disabled={!canAsk || sending}
                className="min-h-16 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button type="button" aria-label="Enviar pregunta" disabled={!canAsk || sending || draft.trim().length < 3} onClick={() => void send()} className="size-10 shrink-0 rounded-xl bg-emerald-700 p-0 text-white hover:bg-emerald-800">
                <Send className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Respondo con la evidencia disponible; no ejecuto acciones ni confirmo caídas sin datos recientes.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
