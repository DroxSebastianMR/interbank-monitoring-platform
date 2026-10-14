import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { REQUIRED_PERMISSIONS_KEY } from '@/modules/auth/constants/auth.constants';
import { AuthErrorCode } from '@/modules/auth/enums/auth-error-code.enum';
import type { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import type { AuthenticatedRequest } from '@/modules/auth/types/auth.types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PermissionCode[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    // Guarded controllers deny new routes until a permission is explicitly declared.
    if (!required?.length) {
      throw new ForbiddenException('La ruta no declara un permiso de acceso');
    }

    const principal = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    const allowed =
      principal && required.every((permission) => principal.permissions.includes(permission));
    if (allowed) return true;

    throw new ForbiddenException({
      statusCode: 403,
      error: 'FORBIDDEN',
      code: AuthErrorCode.ACCESS_DENIED,
      message: 'No cuenta con permisos para realizar esta operación',
    });
  }
}
