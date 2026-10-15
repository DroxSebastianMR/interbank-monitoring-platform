import { Activity, ArrowUpRight, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  '¿Cómo va el sistema ahora?',
  '¿Hay servicios con alertas?',
  'Dame un resumen de los incidentes',
];

export function AssistantEmptyState({
  canAsk,
  onSuggestion,
}: {
  canAsk: boolean;
  onSuggestion: (question: string) => void;
}) {
  return (
    <div className="m-auto w-full max-w-lg px-3 py-10 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <div className="relative mx-auto mb-6 flex size-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-200/70">
        <Sparkles className="size-7" aria-hidden="true" />
        <Activity className="absolute -right-2 -bottom-2 size-7 rounded-full border-2 border-white bg-emerald-50 p-1 text-emerald-700" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-semibold tracking-tight text-slate-900">Hola, estoy aquí para ayudarte</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Pregúntame por el estado de tus servicios, alertas o incidentes. Te responderé con los datos disponibles, sin inventar lo que aún no sabemos.
      </p>
      {canAsk && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((question) => (
            <button key={question} type="button" onClick={() => onSuggestion(question)} className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-medium text-emerald-900 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
              {question}<ArrowUpRight className="size-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
