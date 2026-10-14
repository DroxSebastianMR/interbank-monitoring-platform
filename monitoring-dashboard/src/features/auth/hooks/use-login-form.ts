import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '@/app/providers/auth/use-auth';
import { PATHS } from '@/app/router/constants/paths';
import { loginSchema } from '@/features/auth/schemas/login.schema';

type LoginErrors = Partial<Record<'corporateEmail' | 'password' | 'form', string>>;

export function useLoginForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [corporateEmail, setCorporateEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const parsed = loginSchema.safeParse({ corporateEmail, password });
    if (!parsed.success) {
      const next: LoginErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'corporateEmail' || field === 'password') next[field] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setIsSubmitting(true);
    try {
      await signIn(parsed.data.corporateEmail, parsed.data.password);
      const from = (location.state as { from?: string } | null)?.from;
      const safeFrom = from?.startsWith('/') && !from.startsWith('//') ? from : PATHS.DASHBOARD;
      navigate(safeFrom, { replace: true });
    } catch {
      setErrors({ form: 'No se pudo iniciar sesión. Verifica tus credenciales y la conexión.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { corporateEmail, password, errors, isSubmitting, setCorporateEmail, setPassword, handleSubmit };
}
