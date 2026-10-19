import { Sparkles } from 'lucide-react';

export function AssistantAvatar({ thinking = false }: { thinking?: boolean }) {
  return (
    <span aria-hidden="true" className="relative mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-200">
      <Sparkles className="size-4" strokeWidth={2.2} />
      <span className={`absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-white bg-emerald-400 ${thinking ? 'motion-safe:animate-pulse' : ''}`} />
    </span>
  );
}
