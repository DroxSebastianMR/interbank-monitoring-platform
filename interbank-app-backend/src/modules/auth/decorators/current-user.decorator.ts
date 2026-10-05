import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';

type AuthenticatedRequest = Request & { user: AccessTokenPayload };

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
