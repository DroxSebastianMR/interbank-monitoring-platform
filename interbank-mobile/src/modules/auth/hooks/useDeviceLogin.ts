import { useState } from "react";

import { useAuth } from "@/src/modules/auth/context/AuthProvider";
import { resolveAuthErrorMessage } from "@/src/modules/auth/utils/auth-error.mapper";
import { useToast } from "@/src/modules/system/ui/hooks/useToast";

export function useDeviceLogin() {
  const { user, deviceLogin, useAnotherAccount: switchAccount } = useAuth();
  const { show } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDeviceLogin = async (): Promise<void> => {
    if (password.length < 8) {
      show("Ingresa tu contraseña de al menos 8 caracteres.", "error");
      return;
    }

    try {
      setLoading(true);
      await deviceLogin({ password });
    } catch (error) {
      show(resolveAuthErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUseAnotherAccount = async (): Promise<void> => {
    await switchAccount();
  };

  return {
    user,
    password,
    loading,
    isValid: password.length >= 8,
    setPassword,
    handleDeviceLogin,
    handleUseAnotherAccount,
  };
}
