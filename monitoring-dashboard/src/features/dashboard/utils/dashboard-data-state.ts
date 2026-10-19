export class MonitoringContractError extends Error {
  constructor(
    message = "La respuesta del Monitoring Backend no cumple el contrato esperado.",
  ) {
    super(message);
    this.name = "MonitoringContractError";
  }
}
export function monitoringStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("status" in error && typeof error.status === "number")
    return error.status;
  if (
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "status" in error.response &&
    typeof error.response.status === "number"
  )
    return error.response.status;
  return undefined;
}
export function monitoringFailure(error: unknown, paused = false) {
  const status = monitoringStatus(error);
  if (status === 401)
    return {
      state: "unauthorized" as const,
      message:
        "La sesión no permite consultar esta fuente. Inicia sesión de nuevo.",
    };
  if (status === 403)
    return {
      state: "forbidden" as const,
      message: "El servidor denegó el acceso a esta fuente.",
    };
  if (status === 404 || error instanceof MonitoringContractError)
    return {
      state: "incompatible" as const,
      message:
        "El Monitoring Backend no ofrece el contrato requerido por esta vista.",
    };
  if (paused || status === 0)
    return {
      state: "disconnected" as const,
      message: "No se puede conectar con el Monitoring Backend.",
    };
  return {
    state: "error" as const,
    message: "El Monitoring Backend no pudo completar esta consulta.",
  };
}
export const monitoringAccessDenied = (error: unknown) =>
  [401, 403].includes(monitoringStatus(error) ?? -1);
export const retryMonitoringQuery = (failures: number, error: unknown) =>
  failures < 1 &&
  !monitoringAccessDenied(error) &&
  monitoringStatus(error) !== 404 &&
  !(error instanceof MonitoringContractError);
export const monitoringPoll = (error: unknown) =>
  monitoringAccessDenied(error) ||
  monitoringStatus(error) === 404 ||
  error instanceof MonitoringContractError
    ? false
    : 10_000;
