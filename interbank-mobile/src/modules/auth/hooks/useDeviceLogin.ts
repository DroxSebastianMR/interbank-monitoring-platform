import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, Platform } from "react-native";

import {
  disableDeviceBiometrics,
  getDeviceBiometricState,
} from "@/src/domain/auth/biometric-login.usecase";
import {
  BiometricAuthError,
  BiometricFailure,
  BiometricKind,
} from "@/src/domain/auth/biometric.types";
import { useAuth } from "@/src/modules/auth/context/AuthProvider";
import { resolveAuthErrorMessage } from "@/src/modules/auth/utils/auth-error.mapper";
import { useToast } from "@/src/modules/system/ui/hooks/useToast";

export function useDeviceLogin() {
  const {
    user,
    deviceLogin,
    biometricLogin,
    useAnotherAccount: switchAccount,
  } = useAuth();
  const { show } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordMode, setPasswordMode] = useState(Platform.OS !== "ios");
  const [pendingEnrollment, setPendingEnrollment] = useState(false);
  const [sessionRecoveryNeeded, setSessionRecoveryNeeded] = useState(false);
  const [biometric, setBiometric] = useState({
    kind:
      Platform.OS === "ios"
        ? BiometricKind.FACE_ID
        : Platform.OS === "android"
          ? BiometricKind.FINGERPRINT
          : BiometricKind.NONE,
    available: false,
    enabled: false,
    checking: true,
  });
  const submitting = useRef(false);
  const mounted = useRef(false);
  const biometricLabel =
    biometric.kind === BiometricKind.FACE_ID ? "Face ID" : "huella digital";

  const refreshBiometrics = useCallback(async () => {
    if (submitting.current) return;
    try {
      const state = await getDeviceBiometricState();
      if (mounted.current) {
        setBiometric({ ...state, checking: false });
        if (Platform.OS === "ios" && (!state.available || !state.enabled)) {
          setPasswordMode(true);
        }
      }
    } catch {
      if (mounted.current) {
        setBiometric((current) => ({
          ...current,
          available: false,
          enabled: false,
          checking: false,
        }));
        if (Platform.OS === "ios") setPasswordMode(true);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const initialCheck = setTimeout(() => void refreshBiometrics(), 0);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshBiometrics();
    });
    return () => {
      clearTimeout(initialCheck);
      mounted.current = false;
      subscription.remove();
    };
  }, [refreshBiometrics]);

  const handleDeviceLogin = async (): Promise<void> => {
    if (submitting.current) return;
    if (password.length < 8) {
      show("Ingresa tu contraseña de al menos 8 caracteres.", "error");
      return;
    }
    submitting.current = true;
    setLoading(true);
    try {
      const result = await deviceLogin({
        password,
        enableBiometrics: pendingEnrollment,
      });
      setSessionRecoveryNeeded(false);
      if (result.biometricError)
        show(resolveAuthErrorMessage(new Error(result.biometricError)), "info");
      else if (result.biometricsActivated)
        show(
          `${biometricLabel === "Face ID" ? "Face ID" : "Huella digital"} activada para tu próximo ingreso.`,
          "success",
        );
    } catch (error) {
      if (
        (error instanceof Error &&
          error.message === "DEVICE_SESSION_NOT_FOUND") ||
        (typeof error === "object" &&
          error !== null &&
          "type" in error &&
          error.type === "UNAUTHORIZED")
      ) {
        setSessionRecoveryNeeded(true);
      }
      show(resolveAuthErrorMessage(error), "error");
    } finally {
      submitting.current = false;
      if (mounted.current) {
        setPassword("");
        setLoading(false);
      }
    }
  };

  const handleBeginBiometricSetup = () => {
    if (submitting.current || biometric.checking) return;
    if (!biometric.available) {
      show(
        `${biometricLabel === "Face ID" ? "Face ID" : "La huella digital"} no está disponible. Usa tu contraseña.`,
        "info",
      );
      return;
    }
    setPendingEnrollment(true);
    setPasswordMode(true);
  };

  const handleBiometricLogin = async (): Promise<void> => {
    if (submitting.current || biometric.checking) return;
    if (!biometric.enabled) {
      handleBeginBiometricSetup();
      return;
    }
    submitting.current = true;
    setLoading(true);
    try {
      await biometricLogin();
    } catch (error) {
      if (
        error instanceof BiometricAuthError &&
        error.code === BiometricFailure.INVALIDATED
      ) {
        setBiometric((current) => ({ ...current, enabled: false }));
        setPasswordMode(true);
      }
      show(resolveAuthErrorMessage(error), "error");
    } finally {
      submitting.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  const handleToggleBiometrics = async (enabled: boolean): Promise<void> => {
    if (submitting.current) return;
    if (enabled) {
      handleBeginBiometricSetup();
      return;
    }
    if (pendingEnrollment) {
      setPendingEnrollment(false);
      return;
    }
    submitting.current = true;
    setLoading(true);
    try {
      await disableDeviceBiometrics();
      setBiometric((current) => ({ ...current, enabled: false }));
      setPendingEnrollment(false);
    } catch {
      show(
        "No pudimos desactivar la biometría. Inténtalo nuevamente.",
        "error",
      );
    } finally {
      submitting.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  const handleUseAnotherAccount = async (): Promise<void> => {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    try {
      await switchAccount();
    } catch {
      show(
        "No pudimos desvincular este dispositivo. Inténtalo nuevamente.",
        "error",
      );
    } finally {
      submitting.current = false;
      if (mounted.current) {
        setLoading(false);
        setPassword("");
      }
    }
  };

  const handleLockDevice = () => {
    if (submitting.current) return;
    const message =
      "Se eliminará el acceso recordado y la biometría de esta app en este teléfono. Para volver a ingresar necesitarás DNI, usuario y contraseña. Tus cuentas y tarjetas seguirán activas.";
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(message)) void handleUseAnotherAccount();
      return;
    }
    Alert.alert("Bloquear acceso en este dispositivo", message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Bloquear acceso",
        style: "destructive",
        onPress: () => void handleUseAnotherAccount(),
      },
    ]);
  };

  return {
    user,
    password,
    loading,
    passwordMode,
    biometric,
    biometricLabel,
    pendingEnrollment,
    sessionRecoveryNeeded,
    isValid: password.length >= 8,
    setPassword,
    setPasswordMode,
    handleBeginBiometricSetup,
    handleDeviceLogin,
    handleBiometricLogin,
    handleToggleBiometrics,
    handleUseAnotherAccount,
    handleLockDevice,
  };
}
