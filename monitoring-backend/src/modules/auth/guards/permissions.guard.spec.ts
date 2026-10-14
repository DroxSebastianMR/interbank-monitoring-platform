import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';

function contextWithPermissions(permissions: string[]): ExecutionContext {
  return {
    getHandler: () => contextWithPermissions,
    getClass: () => PermissionsGuard,
    switchToHttp: () => ({
      getRequest: () => ({ user: { permissions } }),
    }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const guard = new PermissionsGuard(reflector);

  it('allows an employee with every required permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PermissionCode.ACCESS_CONTROL_READ]);

    expect(guard.canActivate(contextWithPermissions([PermissionCode.ACCESS_CONTROL_READ]))).toBe(
      true,
    );
  });

  it('denies an employee missing a required permission', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([PermissionCode.ACCESS_CONTROL_MANAGE]);

    expect(() => guard.canActivate(contextWithPermissions([]))).toThrow(ForbiddenException);
  });

  it('denies a guarded route without a declared permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(() =>
      guard.canActivate(contextWithPermissions([PermissionCode.ACCESS_CONTROL_MANAGE])),
    ).toThrow(ForbiddenException);
  });
});
