import { ErrorCode } from '@/common/errors/error-code';
import { ErrorFactory } from '@/common/errors/error.factory';
import { SWAGGER_PATHS } from '@/config/swagger/swagger.constants';

interface DocsRequest {
  path: string;
}

interface DocsResponse {
  status(code: number): DocsResponse;
  json(body: unknown): void;
}

export function docsOnlyMiddleware(
  request: DocsRequest,
  response: DocsResponse,
  next: () => void,
): void {
  const uiPath = `/${SWAGGER_PATHS.ui}`;
  if (
    request.path === uiPath ||
    request.path.startsWith(`${uiPath}/`) ||
    request.path === `/${SWAGGER_PATHS.json}`
  ) {
    next();
    return;
  }
  response.status(503).json(
    ErrorFactory.create({
      statusCode: 503,
      error: 'SERVICE_UNAVAILABLE',
      code: ErrorCode.DOCS_ONLY,
      message: 'Solo documentación: los endpoints operativos están deshabilitados',
      path: request.path,
    }),
  );
}
