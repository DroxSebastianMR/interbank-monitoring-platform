export interface ErrorResponse {
  statusCode: number;
  error: string;
  code: string;
  message: string | string[];
  path: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}
