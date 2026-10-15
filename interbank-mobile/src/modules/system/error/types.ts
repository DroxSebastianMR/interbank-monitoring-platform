import { ErrorType } from "@/src/modules/system/error/ErrorTypes";

export type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  errorType?: ErrorType;
};
