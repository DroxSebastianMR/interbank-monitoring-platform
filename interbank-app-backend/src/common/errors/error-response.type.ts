export interface ErrorResponse {
  statusCode: number;
  error: string;
  code: string;
  message: string | string[];
  timestamp: string;
  path: string;
  meta?: Record<string, unknown>;
}
