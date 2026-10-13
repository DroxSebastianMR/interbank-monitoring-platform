import { SetMetadata } from '@nestjs/common';

import { REQUIRED_PERMISSIONS_KEY } from '@/modules/auth/constants/auth.constants';
import type { PermissionCode } from '@/modules/auth/enums/permission-code.enum';

export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
