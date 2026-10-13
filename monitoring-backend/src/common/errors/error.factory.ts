import type { ErrorResponse } from '@/common/errors/error-response.type';

export class ErrorFactory {
  static create(input: Omit<ErrorResponse, 'timestamp'>): ErrorResponse {
    return { ...input, timestamp: new Date().toISOString() };
  }
}
