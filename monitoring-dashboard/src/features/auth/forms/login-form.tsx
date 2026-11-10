import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginForm } from '@/features/auth/hooks/use-login-form';

export function LoginForm() {
  const form = useLoginForm();
  const reduceMotion = useReducedMotion();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <motion.div className="mx-auto w-full max-w-[390px]" initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }}>
      <div className="mb-9">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#e6f8ec] px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] text-[#08733a] uppercase"><span className="size-1.5 rounded-full bg-[#05a94d] shadow-[0_0_0_4px_#05a94d18]" />Acceso operativo</div>
        <h1 className="max-w-md text-[clamp(2.25rem,4vw,3.1rem)] leading-[1.02] font-semibold tracking-[-0.055em] text-[#0b2b1a]">Bienvenido de vuelta.</h1>
        <p className="mt-3 max-w-[375px] text-[15px] leading-relaxed text-[#60776a]">Ingresa con tus credenciales corporativas para continuar al centro de monitoreo.</p>
      </div>

      <form className="grid gap-5" onSubmit={(event) => void form.handleSubmit(event)} noValidate>
        <div className="grid gap-2.5">
          <Label htmlFor="corporate-email" className="text-[13px] font-bold text-[#163c26]">Correo corporativo</Label>
          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-[#779284]" aria-hidden="true" />
            <Input id="corporate-email" type="email" autoComplete="username" inputMode="email" placeholder="nombre@interbank.pe" value={form.corporateEmail} className="h-[54px] rounded-2xl border-[#d8e6dd] bg-white/90 pr-4 pl-12 text-[15px] text-[#102c1e] shadow-[0_4px_14px_#0d45200b] placeholder:text-[#9aaba1] focus-visible:border-[#00a844] focus-visible:ring-4 focus-visible:ring-[#00a844]/12" onChange={(event) => form.setCorporateEmail(event.target.value)} aria-invalid={!!form.errors.corporateEmail} aria-describedby={form.errors.corporateEmail ? 'email-error' : undefined} />
          </div>
          {form.errors.corporateEmail && <p id="email-error" role="alert" className="text-xs font-medium text-[#b42335]">{form.errors.corporateEmail}</p>}
        </div>

        <div className="grid gap-2.5">
          <div className="flex items-center justify-between gap-4"><Label htmlFor="login-password" className="text-[13px] font-bold text-[#163c26]">Contraseña</Label><span className="text-[11px] font-medium text-[#779284]">Uso corporativo</span></div>
          <div className="relative">
            <LockKeyhole size={18} className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-[#779284]" aria-hidden="true" />
            <Input id="login-password" type={isPasswordVisible ? 'text' : 'password'} autoComplete="current-password" placeholder="Ingresa tu contraseña" value={form.password} className="h-[54px] rounded-2xl border-[#d8e6dd] bg-white/90 pr-12 pl-12 text-[15px] text-[#102c1e] shadow-[0_4px_14px_#0d45200b] placeholder:text-[#9aaba1] focus-visible:border-[#00a844] focus-visible:ring-4 focus-visible:ring-[#00a844]/12" onChange={(event) => form.setPassword(event.target.value)} aria-invalid={!!form.errors.password} aria-describedby={form.errors.password ? 'password-error' : undefined} />
            <button type="button" className="absolute top-1/2 right-3 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-[#6d8879] transition-colors hover:bg-[#eff8f1] hover:text-[#08733a] focus-visible:ring-2 focus-visible:ring-[#00a844]/30 focus-visible:outline-none" onClick={() => setIsPasswordVisible((visible) => !visible)} aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{isPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
          </div>
          {form.errors.password && <p id="password-error" role="alert" className="text-xs font-medium text-[#b42335]">{form.errors.password}</p>}
        </div>

        {form.errors.form && <p role="alert" className="rounded-xl border border-[#f3c9d0] bg-[#fff4f5] px-4 py-3 text-[13px] leading-relaxed text-[#9e2536]">{form.errors.form}</p>}
        <Button type="submit" size="lg" className="mt-1 h-12 w-full rounded-lg bg-[#078542] px-4 text-[14px] font-bold text-white shadow-none transition-colors hover:bg-[#066f37] focus-visible:ring-2 focus-visible:ring-[#00a844]/30 active:translate-y-0" disabled={form.isSubmitting}>{form.isSubmitting ? 'Verificando acceso…' : 'Ingresar al monitor'}{!form.isSubmitting && <ArrowRight size={17} className="ml-auto" aria-hidden="true" />}</Button>
      </form>
    </motion.div>
  );
}
