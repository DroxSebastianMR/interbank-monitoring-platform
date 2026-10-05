import type { ErrorResponse } from '@/common/errors/error-response.type';

export class ErrorFactory {
  static create(params: Omit<ErrorResponse, 'timestamp'>): ErrorResponse {
    return {
      ...params,
      timestamp: new Date().toISOString(),
    };
  }
}
