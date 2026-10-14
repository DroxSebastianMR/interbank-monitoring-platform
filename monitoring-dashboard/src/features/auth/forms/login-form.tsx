import { useLoginForm } from '@/features/auth/hooks/use-login-form';

export function LoginForm() {
  const form = useLoginForm();
  return (
    <form onSubmit={(event) => void form.handleSubmit(event)} noValidate>
      <div className="brand"><span className="pulse" />Sentinel</div>
      <p>Acceso del personal al centro de operaciones</p>
      <label>
        Correo corporativo
        <input type="email" autoComplete="username" value={form.corporateEmail}
          onChange={(event) => form.setCorporateEmail(event.target.value)} aria-invalid={!!form.errors.corporateEmail} />
      </label>
      {form.errors.corporateEmail && <p role="alert" className="form-error">{form.errors.corporateEmail}</p>}
      <label>
        Contraseña
        <input type="password" autoComplete="current-password" value={form.password}
          onChange={(event) => form.setPassword(event.target.value)} aria-invalid={!!form.errors.password} />
      </label>
      {form.errors.password && <p role="alert" className="form-error">{form.errors.password}</p>}
      {form.errors.form && <p role="alert" className="form-error">{form.errors.form}</p>}
      <button disabled={form.isSubmitting}>{form.isSubmitting ? 'Ingresando…' : 'Ingresar'}</button>
      <small>Solo para empleados autorizados.</small>
    </form>
  );
}
