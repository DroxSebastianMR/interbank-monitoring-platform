import { ArgumentsHost, Catch, HttpException, type ExceptionFilter, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';

import { ErrorCode } from '@/common/errors/error-code';
import { ErrorFactory } from '@/common/errors/error.factory';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const details = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message = this.resolveMessage(details, exception);

    if (status >= 500) {
      this.logger.error(
        `Unhandled application error at ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(
      ErrorFactory.create({
        statusCode: status,
        error: this.resolveErrorName(status),
        code: this.resolveCode(details, status),
        message,
        path: request.url,
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
    if (exception instanceof Error && !(exception instanceof HttpException)) {
      return 'Error interno del servidor';
    }
    return 'La solicitud no pudo ser procesada';
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
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
    if (status >= 500) return 'INTERNAL_SERVER_ERROR';
    return 'HTTP_ERROR';
  }
}
