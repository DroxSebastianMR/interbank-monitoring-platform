type ApiErrorPayload = {
  code?: unknown;
};

type InterceptedError = {
  type?: unknown;
  error?: {
    response?: {
      data?: ApiErrorPayload;
    };
  };
};

const AUTH_MESSAGES: Record<string, string> = {
  INVALID_DOCUMENT: "El DNI debe contener 8 dígitos.",
  INVALID_EMAIL: "Ingresa un correo electrónico válido.",
  INVALID_PASSWORD: "La contraseña debe tener al menos 8 caracteres.",
  DEVICE_SESSION_NOT_FOUND: "La sesión de este dispositivo venció. Ingresa con todos tus datos.",
  AUTH_INVALID_CREDENTIALS: "Los datos ingresados no son correctos.",
  NETWORK_ERROR: "No pudimos conectarnos. Revisa tu red e inténtalo nuevamente.",
};

export function resolveAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return AUTH_MESSAGES[error.message] ?? "No pudimos iniciar sesión. Inténtalo nuevamente.";
  }

  if (typeof error === "object" && error !== null) {
    const intercepted = error as InterceptedError;
    const apiCode = intercepted.error?.response?.data?.code;
    if (typeof apiCode === "string" && AUTH_MESSAGES[apiCode]) return AUTH_MESSAGES[apiCode];
    if (typeof intercepted.type === "string" && AUTH_MESSAGES[intercepted.type]) {
      return AUTH_MESSAGES[intercepted.type];
    }
  }

  return "No pudimos iniciar sesión. Inténtalo nuevamente.";
}
