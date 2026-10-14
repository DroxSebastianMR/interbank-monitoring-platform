import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLoginForm } from '@/features/auth/hooks/use-login-form';

export function LoginForm() {
  const form = useLoginForm();

  return (
    <div className="mx-auto my-auto w-full max-w-[414px] py-8">
      <div className="mb-9">
        <span className="text-[11px] font-extrabold tracking-[0.16em] text-[#008e3d]">BIENVENIDO DE NUEVO</span>
        <h1 className="mt-3 mb-2.5 text-[clamp(34px,3vw,43px)] leading-[1.1] font-bold tracking-[-0.045em] text-[#0a2b19]">Inicia sesión</h1>
        <p className="max-w-[365px] text-sm leading-relaxed text-[#65776c]">Ingresa con tus credenciales corporativas para acceder al centro de monitoreo.</p>
      </div>
      <form className="grid gap-6" onSubmit={(event) => void form.handleSubmit(event)} noValidate>
        <div className="grid gap-2.5">
          <Label htmlFor="corporate-email" className="text-[13px] font-semibold text-[#173f29]">Correo corporativo</Label>
          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-[#7d9988]" aria-hidden="true" />
            <Input id="corporate-email" type="email" autoComplete="username" inputMode="email" placeholder="nombre@interbank.pe" value={form.corporateEmail}
              className="h-12 rounded-xl border-[#d6e4da] bg-white pr-4 pl-11 text-sm text-[#102c1e] shadow-sm placeholder:text-[#9cac9e] focus-visible:border-[#00a844] focus-visible:ring-[#00a844]/20"
              onChange={(event) => form.setCorporateEmail(event.target.value)} aria-invalid={!!form.errors.corporateEmail} aria-describedby={form.errors.corporateEmail ? 'email-error' : undefined} />
          </div>
          {form.errors.corporateEmail && <p id="email-error" role="alert" className="text-xs text-[#b42335]">{form.errors.corporateEmail}</p>}
        </div>
        <div className="grid gap-2.5">
          <Label htmlFor="login-password" className="text-[13px] font-semibold text-[#173f29]">Contraseña</Label>
          <div className="relative">
            <LockKeyhole size={18} className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-[#7d9988]" aria-hidden="true" />
            <Input id="login-password" type="password" autoComplete="current-password" placeholder="Ingresa tu contraseña" value={form.password}
              className="h-12 rounded-xl border-[#d6e4da] bg-white pr-4 pl-11 text-sm text-[#102c1e] shadow-sm placeholder:text-[#9cac9e] focus-visible:border-[#00a844] focus-visible:ring-[#00a844]/20"
              onChange={(event) => form.setPassword(event.target.value)} aria-invalid={!!form.errors.password} aria-describedby={form.errors.password ? 'password-error' : undefined} />
          </div>
          {form.errors.password && <p id="password-error" role="alert" className="text-xs text-[#b42335]">{form.errors.password}</p>}
        </div>
        {form.errors.form && <p role="alert" className="rounded-lg border border-[#f3c9d0] bg-[#fff4f5] px-3 py-2.5 text-[13px] leading-relaxed text-[#9e2536]">{form.errors.form}</p>}
        <Button type="submit" size="lg" className="mt-1.5 h-12 w-full rounded-xl bg-[#008f3c] text-sm font-bold text-white shadow-[0_8px_22px_#008f3c2c] hover:bg-[#007c36] focus-visible:ring-[#99eab6]" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Ingresando…' : 'Ingresar al monitor'}
          {!form.isSubmitting && <ArrowRight size={17} className="ml-auto" aria-hidden="true" />}
        </Button>
      </form>
      <div className="mt-7 flex items-center gap-2 text-xs leading-snug text-[#7e9183]"><LockKeyhole size={15} className="shrink-0 text-[#11994d]" aria-hidden="true" /><span>Entorno privado y seguro para el equipo de operaciones.</span></div>
    </div>
  );
}
