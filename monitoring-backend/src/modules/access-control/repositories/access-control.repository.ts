import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditAction } from '@/modules/auth/enums/audit-action.enum';
import { EmployeeRoleCode } from '@/modules/auth/enums/employee-role-code.enum';
import type { EmployeePrincipal, RequestMetadata } from '@/modules/auth/types/auth.types';
import type {
  PermissionDto,
  RoleDto,
} from '@/modules/access-control/dto/access-control-response.dto';

@Injectable()
export class AccessControlRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRoles(): Promise<RoleDto[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: { permissions: { include: { permission: true } } },
    });

    return roles.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      permissions: role.permissions.map(({ permission }) => permission.code).sort(),
    }));
  }

  findPermissions(): Promise<PermissionDto[]> {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      select: {
        id: true,
        code: true,
        resource: true,
        action: true,
        description: true,
      },
    });
  }

  async replaceEmployeeRoles(
    employeeId: string,
    roleCodes: EmployeeRoleCode[],
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<void> {
    const [employee, roles] = await Promise.all([
      this.prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } }),
      this.prisma.role.findMany({
        where: { code: { in: roleCodes } },
        select: { id: true, code: true },
      }),
    ]);

    if (!employee) throw new NotFoundException('Empleado no encontrado');
    if (roles.length !== roleCodes.length) {
      throw new BadRequestException('Uno o más roles no existen');
    }

    await this.prisma.$transaction(async (transaction) => {
      const removesAdministrator = !roleCodes.includes(EmployeeRoleCode.ADMINISTRATOR);
      if (removesAdministrator) {
        const targetIsAdministrator = await transaction.employeeRole.count({
          where: { employeeId, role: { code: EmployeeRoleCode.ADMINISTRATOR } },
        });
        if (targetIsAdministrator) {
          const activeAdministrators = await transaction.employeeRole.count({
            where: {
              role: { code: EmployeeRoleCode.ADMINISTRATOR },
              employee: { status: 'ACTIVE' },
            },
          });
          if (activeAdministrators <= 1) {
            throw new BadRequestException('No se puede retirar el último administrador activo');
          }
        }
      }

      await transaction.employeeRole.deleteMany({ where: { employeeId } });
      await transaction.employeeRole.createMany({
        data: roles.map((role) => ({ employeeId, roleId: role.id })),
      });
      await transaction.auditLog.create({
        data: {
          actorId: actor.id,
          action: AuditAction.EMPLOYEE_ROLES_UPDATED,
          resource: 'employee',
          resourceId: employeeId,
          outcome: 'SUCCESS',
          ipAddress: metadata.ipAddress,
          metadata: { roleCodes },
        },
      });
    });
  }
}
