import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Plus, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/app/providers/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { assistantService } from '@/features/assistant/services/assistant.service';
import type { AssistantMessage } from '@/features/assistant/types/assistant.types';

function MessageCard({ message }: { message: AssistantMessage }) {
  const fromAssistant = message.role === 'assistant';
  return (
    <article className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm ${fromAssistant ? 'self-start border border-emerald-100 bg-white text-slate-800' : 'self-end bg-emerald-700 text-white'}`}>
      <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
      {fromAssistant && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
          <span>{message.provider === 'openrouter' ? 'Respuesta asistida por IA' : 'Resumen local de evidencia'}</span>
          {message.evidence?.asOf && <span>· Datos al {new Date(message.evidence.asOf).toLocaleString('es-PE')}</span>}
        </div>
      )}
    </article>
  );
}

export function AssistantPage() {
  const { employee } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canRead = employee?.permissions.includes('assistant.read') ?? false;
  const canAsk = employee?.permissions.includes('assistant.ask') ?? false;
  const conversations = useQuery({ queryKey: ['assistant-conversations'], queryFn: assistantService.conversations, enabled: canRead });
  const messages = useQuery({ queryKey: ['assistant-messages', selectedId], queryFn: () => assistantService.messages(selectedId!), enabled: canRead && !!selectedId });

  async function newConversation() {
    setError(null);
    try {
      const conversation = await assistantService.create();
      setSelectedId(conversation.id);
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
    try {
      await assistantService.remove(id);
      if (selectedId === id) setSelectedId(null);
      await queryClient.invalidateQueries({ queryKey: ['assistant-conversations'] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo eliminar la conversación');
    }
  }

  if (!canRead) return <div className="notice" role="alert">No tienes permiso para consultar el asistente.</div>;
  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Centro de monitoreo</p><h2 className="text-2xl font-semibold text-slate-900">Asistente operativo</h2><p className="mt-1 text-sm text-slate-500">Respuestas sobre servicios e incidentes, basadas en evidencia observada.</p></div>
        {canAsk && <Button onClick={() => void newConversation()} className="bg-emerald-700 text-white hover:bg-emerald-800"><Plus /> Nueva conversación</Button>}
      </div>
      <div className="grid min-h-[560px] overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-emerald-100 bg-emerald-50/60 p-3 md:border-b-0 md:border-r">
          <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-800">Historial</p>
          {conversations.isLoading && <p className="px-2 text-sm text-slate-500">Cargando…</p>}
          {conversations.isError && <p className="px-2 text-sm text-red-700">No se pudo cargar el historial.</p>}
          <div className="flex max-h-48 flex-col gap-1 overflow-auto md:max-h-[480px]">
            {conversations.data?.map((item) => (
              <div key={item.id} className={`flex items-center rounded-xl ${selectedId === item.id ? 'bg-white shadow-sm' : 'hover:bg-white/70'}`}>
                <button type="button" onClick={() => setSelectedId(item.id)} className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm text-slate-700">{item.title}</button>
                <button type="button" onClick={() => void remove(item.id)} aria-label={`Eliminar ${item.title}`} className="p-2 text-slate-400 hover:text-red-700"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </aside>
        <div className="flex min-h-[540px] min-w-0 flex-col bg-gradient-to-b from-white to-emerald-50/30">
          <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 sm:p-6" aria-live="polite">
            {!selectedId && <div className="m-auto max-w-md text-center"><MessageCircle className="mx-auto mb-3 size-10 text-emerald-600" /><h3 className="text-lg font-semibold text-slate-900">¿Qué necesitas revisar?</h3><p className="mt-2 text-sm text-slate-500">Puedes preguntar por el estado de login, balance, transferencias o incidentes. Si falta información, el asistente lo indicará.</p></div>}
            {selectedId && messages.isLoading && <p className="text-sm text-slate-500">Cargando mensajes…</p>}
            {selectedId && messages.data?.length === 0 && <p className="m-auto text-center text-sm text-slate-500">Inicia una consulta sobre el monitor.</p>}
            {messages.data?.map((message) => <MessageCard key={message.id} message={message} />)}
            {sending && <p className="self-start text-sm text-emerald-700" role="status">Consultando evidencias y preparando respuesta…</p>}
          </div>
          <div className="border-t border-emerald-100 bg-white p-4">
            {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}
            <div className="flex items-end gap-2">
              <Textarea aria-label="Pregunta para el asistente" placeholder="Ej.: ¿Cómo está el servicio de login?" maxLength={1000} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} disabled={!canAsk || sending} className="min-h-20 flex-1 resize-none" />
              <Button aria-label="Enviar pregunta" disabled={!canAsk || sending || draft.trim().length < 3} onClick={() => void send()} className="h-10 bg-emerald-700 px-4 text-white hover:bg-emerald-800"><Send /></Button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Solo consultas de monitoreo. La IA no ejecuta acciones ni confirma una caída sin evidencia reciente.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
