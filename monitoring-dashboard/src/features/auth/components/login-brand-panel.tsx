import { Activity, Database, Network, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { InterbankMonitorLogo } from '@/features/auth/components/interbank-monitor-logo';

const systemNodes = [
  { icon: Network, label: 'Gateway', detail: 'Tráfico protegido', position: 'left-[8%] top-[41%] lg:left-[10%]' },
  { icon: Activity, label: 'Servicios', detail: 'Observabilidad activa', position: 'right-[8%] top-[35%] lg:right-[10%]' },
  { icon: Database, label: 'Datos', detail: 'Eventos trazables', position: 'bottom-[18%] left-[31%] lg:left-[35%]' },
];

export function LoginBrandPanel() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate hidden min-h-svh overflow-hidden bg-[#043d27] px-8 py-9 text-white md:flex md:flex-col lg:px-12 lg:py-11 xl:px-16" aria-label="Interbank Monitor">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_73%_22%,#11a866_0%,transparent_26%),radial-gradient(circle_at_14%_88%,#076947_0%,transparent_32%),linear-gradient(142deg,#043d27_0%,#075837_48%,#043a28_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(#b8ffe033_1px,transparent_1px),linear-gradient(90deg,#b8ffe033_1px,transparent_1px)] [background-size:48px_48px]" />
      <motion.div className="absolute -right-32 -bottom-36 -z-10 size-[30rem] rounded-full border border-white/10 bg-white/[0.035]" animate={reduceMotion ? undefined : { rotate: 360 }} transition={{ duration: 70, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }} />
      <motion.div className="absolute -top-32 -left-32 -z-10 size-80 rounded-full border border-emerald-200/10 bg-emerald-300/[0.05]" animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.35, 0.75, 0.35] }} transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }} />

      <motion.div initial={reduceMotion ? false : { opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
        <InterbankMonitorLogo />
      </motion.div>

      <div className="my-auto max-w-xl pt-14 lg:scale-90 lg:transform-gpu lg:pt-8 lg:origin-left">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.12 }}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100/15 bg-white/[0.08] px-3 py-1.5 text-[11px] font-semibold tracking-[0.15em] text-emerald-50/90 uppercase backdrop-blur-sm">
            <span className="relative flex size-2" aria-hidden="true"><span className="absolute inline-flex size-full animate-ping rounded-full bg-[#6cf1a2] opacity-65" /><span className="relative inline-flex size-2 rounded-full bg-[#91f5b6]" /></span>
            Centro de operaciones
          </div>
          <h2 className="max-w-lg text-4xl leading-[1.04] font-semibold tracking-[-0.055em] text-white lg:text-5xl xl:text-[3.35rem]">Visibilidad para responder antes del impacto.</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-emerald-50/75 lg:text-[17px]">Una vista unificada de servicios, incidentes y señales operativas para el equipo que mantiene la banca disponible.</p>
        </motion.div>

        <motion.div className="relative mt-9 h-[236px] max-w-[500px] rounded-[26px] border border-white/15 bg-[#053c29]/60 p-5 shadow-[0_25px_70px_#001f1359] backdrop-blur-md lg:mt-10" initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-medium text-emerald-50/85"><Sparkles size={15} className="text-[#8af0b3]" aria-hidden="true" />Mapa operativo</div><span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] text-emerald-100/85 uppercase">En vivo</span></div>
          <div className="absolute top-[49%] right-[23%] left-[23%] h-px bg-gradient-to-r from-transparent via-emerald-200/70 to-transparent" />
          <motion.div className="absolute top-[49%] left-[25%] h-1 w-1 rounded-full bg-[#b8ffcf] shadow-[0_0_14px_5px_#65ed9e99]" animate={reduceMotion ? undefined : { x: ['0%', '560%', '0%'], opacity: [0, 1, 1, 0] }} transition={{ duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }} />
          {systemNodes.map(({ icon: Icon, label, detail, position }, index) => (
            <motion.div key={label} className={`absolute ${position} rounded-2xl border border-white/12 bg-white/[0.09] px-3 py-2.5 shadow-lg backdrop-blur-sm`} animate={reduceMotion ? undefined : { y: [0, index % 2 === 0 ? -6 : 6, 0] }} transition={{ duration: 4.8 + index * 0.65, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}>
              <div className="flex items-center gap-2.5"><span className="grid size-8 place-items-center rounded-xl bg-emerald-200/15 text-[#a8f5c4]"><Icon size={16} aria-hidden="true" /></span><span><span className="block text-xs font-semibold text-white">{label}</span><span className="mt-0.5 block text-[10px] text-emerald-50/60">{detail}</span></span></div>
            </motion.div>
          ))}
          <div className="absolute right-5 bottom-4 left-5 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-emerald-50/60"><span>Señales centralizadas</span><span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} className="text-[#8af0b3]" aria-hidden="true" />Acceso protegido</span></div>
        </motion.div>
      </div>

    </section>
  );
}
