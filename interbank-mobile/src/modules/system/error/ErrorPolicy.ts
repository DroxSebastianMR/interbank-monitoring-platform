import { ErrorType } from "@/src/modules/system/error/ErrorTypes";

export function resolveErrorType(error: Error): ErrorType {
  if (error.message.includes("Network")) return ErrorType.NETWORK;
  if (error.message.includes("Auth")) return ErrorType.AUTH;
  return ErrorType.RENDER;
}
