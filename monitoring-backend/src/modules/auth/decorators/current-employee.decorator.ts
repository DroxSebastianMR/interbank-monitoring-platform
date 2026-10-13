import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AuthenticatedRequest, EmployeePrincipal } from '@/modules/auth/types/auth.types';

export const CurrentEmployee = createParamDecorator(
  (_data: unknown, context: ExecutionContext): EmployeePrincipal =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
