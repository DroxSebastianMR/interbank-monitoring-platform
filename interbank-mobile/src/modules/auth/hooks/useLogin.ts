import { useState } from "react";

import { useAuth } from "@/src/modules/auth/context/AuthProvider";
import type { LoginCredentials } from "@/src/modules/auth/types/auth.types";
import { resolveAuthErrorMessage } from "@/src/modules/auth/utils/auth-error.mapper";
import { useToast } from "@/src/modules/system/ui/hooks/useToast";

const INITIAL_FORM: LoginCredentials = {
  documentNumber: "",
  email: "",
  password: "",
};

export function useLogin() {
  const { login } = useAuth();
  const { show } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  const onChange = (field: keyof LoginCredentials, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLogin = async (): Promise<void> => {
    if (!form.documentNumber.trim() || !form.email.trim() || !form.password) {
      show("Completa todos los campos", "error");
      return;
    }
    try {
      setLoading(true);
      await login(form);
    } catch (error) {
      show(resolveAuthErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    /^\d{8}$/.test(form.documentNumber.trim()) &&
    form.email.trim().length > 0 &&
    form.password.length >= 8;

  return { form, loading, isValid, onChange, handleLogin };
}
