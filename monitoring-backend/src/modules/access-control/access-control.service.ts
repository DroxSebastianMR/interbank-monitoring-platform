import { Injectable, NotFoundException } from '@nestjs/common';

import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import type { EmployeeRoleCode } from '@/modules/auth/enums/employee-role-code.enum';
import type { EmployeePrincipal, RequestMetadata } from '@/modules/auth/types/auth.types';
import type {
  EmployeeRolesUpdatedDto,
  PermissionDto,
  RoleDto,
} from '@/modules/access-control/dto/access-control-response.dto';
import { AccessControlRepository } from '@/modules/access-control/repositories/access-control.repository';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly repository: AccessControlRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  roles(): Promise<RoleDto[]> {
    return this.repository.findRoles();
  }

  permissions(): Promise<PermissionDto[]> {
    return this.repository.findPermissions();
  }

  async assignRoles(
    employeeId: string,
    roleCodes: EmployeeRoleCode[],
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<EmployeeRolesUpdatedDto> {
    await this.repository.replaceEmployeeRoles(employeeId, roleCodes, actor, metadata);
    const employee = await this.authRepository.findEmployeeById(employeeId);
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }
}
