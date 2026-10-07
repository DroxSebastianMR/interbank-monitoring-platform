import { ArgumentsHost, Catch, HttpException, type ExceptionFilter, Logger } from '@nestjs/common';

import type { HttpRequest } from '@/modules/auth/types/auth.types';
import { ErrorCode } from '@/common/errors/error-code';
import { ErrorFactory } from '@/common/errors/error.factory';

interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: unknown): void;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<HttpResponse>();
    const request = context.getRequest<HttpRequest & { url?: string }>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const details = exception instanceof HttpException ? exception.getResponse() : undefined;
    const path = request.url ?? 'unknown';

    if (status >= 500) {
      this.logger.error(
        `Unhandled application error at ${path}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(
      ErrorFactory.create({
        statusCode: status,
        error: this.resolveErrorName(status),
        code: this.resolveCode(details, status),
        message: this.resolveMessage(details, exception),
        path,
        ...(typeof details === 'object' && details !== null ? { meta: { details } } : {}),
      }),
    );
  }

  private resolveMessage(
    details: string | object | undefined,
    exception: unknown,
  ): string | string[] {
    if (typeof details === 'string') return details;
    if (details && 'message' in details) {
      const message = (details as { message?: unknown }).message;
      if (typeof message === 'string' || this.isStringArray(message)) return message;
    }
    return exception instanceof HttpException
      ? 'La solicitud no pudo ser procesada'
      : 'Error interno del servidor';
  }

  private resolveCode(details: string | object | undefined, status: number): string {
    if (details && typeof details === 'object' && 'code' in details) {
      const code = (details as { code?: unknown }).code;
      if (typeof code === 'string') return code;
    }
    if (status === 400) return ErrorCode.VALIDATION_ERROR;
    if (status >= 500) return ErrorCode.INTERNAL_ERROR;
    return ErrorCode.HTTP_ERROR;
  }

  private resolveErrorName(status: number): string {
    if (status === 400) return 'BAD_REQUEST';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 423) return 'LOCKED';
    if (status === 429) return 'TOO_MANY_REQUESTS';
    if (status >= 500) return 'INTERNAL_SERVER_ERROR';
    return 'HTTP_ERROR';
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }
}
