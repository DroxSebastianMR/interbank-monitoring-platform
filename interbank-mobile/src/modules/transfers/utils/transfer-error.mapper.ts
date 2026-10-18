const MESSAGES: Record<string, string> = {
  INVALID_ACCOUNT_NUMBER:
    "Revisa el número de cuenta. Debe contener entre 10 y 20 dígitos.",
  DESTINATION_NOT_FOUND:
    "No encontramos una cuenta disponible con ese número. Revisa los datos.",
  SOURCE_NOT_FOUND: "La cuenta de origen ya no está disponible.",
  SOURCE_UNAVAILABLE: "Esta cuenta no está disponible para transferencias.",
  DESTINATION_UNAVAILABLE: "Esta cuenta no puede recibir transferencias.",
  NETWORK_ERROR:
    "No pudimos conectarnos. Revisa tu conexión e inténtalo nuevamente.",
  UNAUTHORIZED: "Tu sesión venció. Vuelve a iniciar sesión.",
  FORBIDDEN: "Tu sesión no permite consultar esta cuenta.",
};

export function transferErrorMessage(error: unknown): string {
  if (error instanceof Error)
    return (
      MESSAGES[error.message] ??
      "No pudimos consultar la cuenta. Inténtalo nuevamente."
    );
  const failure = error as {
    type?: string;
    error?: { response?: { status?: number; data?: { code?: string } } };
  } | null;
  if (failure?.error?.response?.status === 429)
    return "Has realizado varias consultas. Espera un momento antes de intentar otra vez.";
  const code = failure?.error?.response?.data?.code ?? failure?.type ?? "";
  return (
    MESSAGES[code] ?? "No pudimos consultar la cuenta. Inténtalo nuevamente."
  );
}
