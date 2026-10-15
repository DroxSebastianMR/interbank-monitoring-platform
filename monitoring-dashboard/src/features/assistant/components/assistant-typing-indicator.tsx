import { AssistantAvatar } from '@/features/assistant/components/assistant-avatar';

export function AssistantTypingIndicator() {
  return (
    <div className="flex items-start gap-3 self-start" role="status" aria-label="El asistente está preparando una respuesta">
      <AssistantAvatar thinking />
      <div className="rounded-[22px] rounded-tl-md border border-emerald-100 bg-white px-4 py-3 shadow-sm shadow-emerald-100/70">
        <p className="text-xs font-medium text-emerald-800">Revisando las señales del sistema</p>
        <div aria-hidden="true" className="mt-2 flex gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-bounce motion-reduce:animate-none" />
          <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-bounce motion-reduce:animate-none [animation-delay:150ms]" />
          <span className="size-1.5 rounded-full bg-emerald-500 motion-safe:animate-bounce motion-reduce:animate-none [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
