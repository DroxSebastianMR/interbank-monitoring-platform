import { useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";

import { useAuth } from "@/src/modules/auth/context/AuthProvider";
import type { LoginCredentials } from "@/src/modules/auth/types/auth.types";
import { resolveAuthErrorMessage } from "@/src/modules/auth/utils/auth-error.mapper";
import { useToast } from "@/src/modules/system/ui/hooks/useToast";
import { isValidEmail } from "@/src/shared/validators/email.validator";

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
  const submitting = useRef(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    documentNumber: /^\d{8}$/.test(form.documentNumber.trim())
      ? undefined
      : "Ingresa los 8 dígitos de tu DNI.",
    email: isValidEmail(form.email.trim())
      ? undefined
      : "Ingresa tu correo registrado como usuario.",
    password:
      form.password.length >= 8
        ? undefined
        : "Tu contraseña debe tener al menos 8 caracteres.",
  };
  const isValid = !errors.documentNumber && !errors.email && !errors.password;
  const onChange = (field: keyof LoginCredentials, value: string): void => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleLogin = async (): Promise<void> => {
    if (submitting.current) return;
    if (!isValid) {
      setSubmitted(true);
      AccessibilityInfo.announceForAccessibility(
        "Revisa los campos marcados antes de continuar",
      );
      return;
    }
    try {
      submitting.current = true;
      setLoading(true);
      await login(form);
    } catch (error) {
      show(resolveAuthErrorMessage(error), "error");
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const fieldErrors = {
    documentNumber: submitted ? errors.documentNumber : undefined,
    email: submitted ? errors.email : undefined,
    password: submitted ? errors.password : undefined,
  };
  return { form, loading, fieldErrors, onChange, handleLogin };
}
