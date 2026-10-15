import type { Currency } from "@/src/infrastructure/api/home/services/home.types";

export function formatPaymentMoney(value: string, currency: Currency): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function formatPaymentDate(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const MESSAGES: Record<string, string> = {
  INVALID_CUSTOMER_REFERENCE:
    "Revisa el código de cliente o suministro de tu recibo.",
  INVALID_PAYMENT_AMOUNT:
    "Ingresa un monto válido dentro de los límites del servicio.",
  INSUFFICIENT_FUNDS:
    "Tu saldo no alcanza para el pago y su comisión. Selecciona otra cuenta.",
  CURRENCY_MISMATCH: "Selecciona una cuenta en la moneda del servicio.",
  ACCOUNT_UNAVAILABLE:
    "Esta cuenta no permite realizar el pago. Selecciona otra cuenta.",
  ACCOUNT_NOT_FOUND: "La cuenta seleccionada ya no está disponible.",
  SERVICE_UNAVAILABLE:
    "La empresa no está disponible para pagos en este momento.",
  SERVICE_NOT_FOUND:
    "El servicio ya no está disponible. Vuelve a buscar la empresa.",
  DEBT_ALREADY_PAID:
    "Este recibo ya fue pagado. Consulta tus recibos nuevamente.",
  DEBT_EXPIRED: "Este recibo ya no admite pagos. Consulta con la empresa.",
  DEBT_NOT_FOUND: "No encontramos ese recibo. Realiza una nueva consulta.",
  UNAUTHORIZED: "Tu sesión venció. Vuelve a iniciar sesión.",
  NETWORK_ERROR:
    "No pudimos conectarnos. Revisa tu conexión e inténtalo nuevamente.",
};

export function paymentErrorMessage(error: unknown): string {
  if (error instanceof Error)
    return (
      MESSAGES[error.message] ??
      "No pudimos completar la operación. Inténtalo nuevamente."
    );
  const failure = error as {
    type?: string;
    error?: { response?: { data?: { code?: string } } };
  } | null;
  const code = failure?.error?.response?.data?.code ?? failure?.type ?? "";
  return (
    MESSAGES[code] ?? "No pudimos completar la operación. Inténtalo nuevamente."
  );
}
