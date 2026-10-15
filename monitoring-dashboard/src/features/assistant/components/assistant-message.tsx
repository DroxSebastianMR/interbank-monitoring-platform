import { AssistantAvatar } from '@/features/assistant/components/assistant-avatar';
import type { AssistantMessage as AssistantMessageType } from '@/features/assistant/types/assistant.types';

export function AssistantMessage({ message }: { message: AssistantMessageType }) {
  if (message.role === 'user') {
    return (
      <article className="max-w-[88%] self-end rounded-[22px] rounded-br-md bg-emerald-700 px-4 py-3 text-sm leading-6 text-white shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </article>
    );
  }

  const hasEvidence = Boolean(message.evidence?.serviceIds?.length);
  const source = message.provider === 'openrouter'
    ? 'Respuesta con IA'
    : hasEvidence ? 'Resumen de datos observados' : 'Orientación del asistente';

  return (
    <div className="flex max-w-[92%] items-start gap-3 self-start motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
      <AssistantAvatar />
      <article className="min-w-0 rounded-[22px] rounded-tl-md border border-emerald-100 bg-white px-4 py-3 shadow-sm shadow-emerald-100/70">
        <p className="mb-1 text-xs font-semibold tracking-wide text-emerald-700">Interbank Monitor</p>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{message.content}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-500">
          <span>{source}</span>
          {hasEvidence && message.evidence?.asOf && (
            <span>· Datos al {new Date(message.evidence.asOf).toLocaleString('es-PE')}</span>
          )}
        </div>
      </article>
    </div>
  );
}
