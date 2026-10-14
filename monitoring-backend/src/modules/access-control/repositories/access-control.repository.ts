import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditAction } from '@/modules/auth/enums/audit-action.enum';
import { EmployeeRoleCode } from '@/modules/auth/enums/employee-role-code.enum';
import type { EmployeePrincipal, RequestMetadata } from '@/modules/auth/types/auth.types';
import type {
  EmployeeSummaryDto,
  PermissionDto,
  RoleDto,
} from '@/modules/access-control/dto/access-control-response.dto';
import type { CreateEmployeeDto } from '@/modules/access-control/dto/create-employee.dto';
import type { CreateRoleDto, UpdateRoleDto } from '@/modules/access-control/dto/create-role.dto';

const EMPLOYEE_SUMMARY_SELECT = {
  id: true,
  employeeCode: true,
  corporateEmail: true,
  firstName: true,
  lastName: true,
  jobTitle: true,
  department: true,
  status: true,
  lastLoginAt: true,
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
} satisfies Prisma.EmployeeSelect;

type EmployeeRecord = Prisma.EmployeeGetPayload<{ select: typeof EMPLOYEE_SUMMARY_SELECT }>;

@Injectable()
export class AccessControlRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRoles(): Promise<RoleDto[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: { permissions: { include: { permission: true } } },
    });

    return roles.map((role) => this.toRoleDto(role));
  }

  async findRole(roleId: string): Promise<RoleDto> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    return this.toRoleDto(role);
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

  async findEmployees(skip: number, take: number): Promise<EmployeeSummaryDto[]> {
    const employees = await this.prisma.employee.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: EMPLOYEE_SUMMARY_SELECT,
    });
    return employees.map((employee) => this.toEmployeeDto(employee));
  }

  async findEmployee(employeeId: string): Promise<EmployeeSummaryDto> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: EMPLOYEE_SUMMARY_SELECT,
    });
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return this.toEmployeeDto(employee);
  }

  async createEmployee(
    input: CreateEmployeeDto,
    passwordHash: string,
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<EmployeeSummaryDto> {
    const roles = await this.resolveRoles(input.roleCodes);
    try {
      const employee = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.employee.create({
          data: {
            employeeCode: input.employeeCode.trim(),
            corporateEmail: input.corporateEmail.trim().toLowerCase(),
            passwordHash,
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            jobTitle: input.jobTitle?.trim(),
            department: input.department?.trim(),
            roles: { create: roles.map((role) => ({ roleId: role.id })) },
          },
          select: EMPLOYEE_SUMMARY_SELECT,
        });
        await transaction.auditLog.create({
          data: {
            actorId: actor.id,
            action: AuditAction.EMPLOYEE_CREATED,
            resource: 'employee',
            resourceId: created.id,
            outcome: 'SUCCESS',
            ipAddress: metadata.ipAddress,
            metadata: { roleCodes: input.roleCodes },
          },
        });
        return created;
      });
      return this.toEmployeeDto(employee);
    } catch (error) {
      if (this.isUniqueConflict(error))
        throw new ConflictException('Código o correo ya registrado');
      throw error;
    }
  }

  async updateEmployeeStatus(
    employeeId: string,
    status: EmployeeStatus,
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<EmployeeSummaryDto> {
    if (employeeId === actor.id && status === EmployeeStatus.DISABLED) {
      throw new BadRequestException('No puede desactivar su propia cuenta');
    }
    await this.prisma.$transaction(
      async (transaction) => {
        const employee = await transaction.employee.findUnique({
          where: { id: employeeId },
          select: { status: true },
        });
        if (!employee) throw new NotFoundException('Empleado no encontrado');
        if (employee.status === status) return;
        if (status === EmployeeStatus.DISABLED) {
          await this.assertAnotherAdministrator(transaction, employeeId);
        }
        await transaction.employee.update({ where: { id: employeeId }, data: { status } });
        if (status === EmployeeStatus.DISABLED) {
          await transaction.authSession.updateMany({
            where: { employeeId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
        }
        await transaction.auditLog.create({
          data: {
            actorId: actor.id,
            action: AuditAction.EMPLOYEE_STATUS_UPDATED,
            resource: 'employee',
            resourceId: employeeId,
            outcome: 'SUCCESS',
            ipAddress: metadata.ipAddress,
            metadata: { status },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return this.findEmployee(employeeId);
  }

  async createRole(
    input: CreateRoleDto,
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<RoleDto> {
    const permissions = await this.resolvePermissions(input.permissionCodes);
    try {
      const role = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.role.create({
          data: {
            code: input.code,
            name: input.name.trim(),
            description: input.description?.trim(),
            isSystem: false,
            permissions: {
              create: permissions.map((permission) => ({ permissionId: permission.id })),
            },
          },
          include: { permissions: { include: { permission: true } } },
        });
        await transaction.auditLog.create({
          data: {
            actorId: actor.id,
            action: AuditAction.ROLE_CREATED,
            resource: 'role',
            resourceId: created.id,
            outcome: 'SUCCESS',
            ipAddress: metadata.ipAddress,
            metadata: { permissionCodes: input.permissionCodes },
          },
        });
        return created;
      });
      return this.toRoleDto(role);
    } catch (error) {
      if (this.isUniqueConflict(error)) throw new ConflictException('El código de rol ya existe');
      throw error;
    }
  }

  async updateRole(
    roleId: string,
    input: UpdateRoleDto,
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<RoleDto> {
    const permissions = await this.resolvePermissions(input.permissionCodes);
    await this.prisma.$transaction(
      async (transaction) => {
        await this.assertCustomRole(transaction, roleId);
        await transaction.role.update({
          where: { id: roleId },
          data: { name: input.name.trim(), description: input.description?.trim() },
        });
        await transaction.rolePermission.deleteMany({ where: { roleId } });
        await transaction.rolePermission.createMany({
          data: permissions.map((permission) => ({ roleId, permissionId: permission.id })),
        });
        await transaction.auditLog.create({
          data: {
            actorId: actor.id,
            action: AuditAction.ROLE_UPDATED,
            resource: 'role',
            resourceId: roleId,
            outcome: 'SUCCESS',
            ipAddress: metadata.ipAddress,
            metadata: { permissionCodes: input.permissionCodes },
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return this.findRole(roleId);
  }

  async deleteRole(
    roleId: string,
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await this.assertCustomRole(transaction, roleId);
      const assigned = await transaction.employeeRole.count({ where: { roleId } });
      if (assigned)
        throw new ConflictException('Retire el rol de sus empleados antes de eliminarlo');
      await transaction.role.delete({ where: { id: roleId } });
      await transaction.auditLog.create({
        data: {
          actorId: actor.id,
          action: AuditAction.ROLE_DELETED,
          resource: 'role',
          resourceId: roleId,
          outcome: 'SUCCESS',
          ipAddress: metadata.ipAddress,
        },
      });
    });
  }

  async replaceEmployeeRoles(
    employeeId: string,
    roleCodes: string[],
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<void> {
    const [employee, roles] = await Promise.all([
      this.prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } }),
      this.resolveRoles(roleCodes),
    ]);

    if (!employee) throw new NotFoundException('Empleado no encontrado');

    if (employeeId === actor.id && !roleCodes.includes(EmployeeRoleCode.ADMINISTRATOR)) {
      throw new BadRequestException('No puede retirar su propio rol de administrador');
    }

    await this.prisma.$transaction(
      async (transaction) => {
        const removesAdministrator = !roleCodes.includes(EmployeeRoleCode.ADMINISTRATOR);
        if (removesAdministrator) {
          const targetIsAdministrator = await transaction.employeeRole.count({
            where: { employeeId, role: { code: EmployeeRoleCode.ADMINISTRATOR } },
          });
          if (targetIsAdministrator) {
            await this.assertAnotherAdministrator(transaction, employeeId);
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async resolveRoles(codes: string[]): Promise<{ id: string; code: string }[]> {
    const roles = await this.prisma.role.findMany({
      where: { code: { in: codes } },
      select: { id: true, code: true },
    });
    if (roles.length !== codes.length) throw new BadRequestException('Uno o más roles no existen');
    return roles;
  }

  private async resolvePermissions(codes: string[]): Promise<{ id: string }[]> {
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: codes } },
      select: { id: true },
    });
    if (permissions.length !== codes.length) {
      throw new BadRequestException('Uno o más permisos no existen en el catálogo');
    }
    return permissions;
  }

  private async assertCustomRole(
    transaction: Prisma.TransactionClient,
    roleId: string,
  ): Promise<void> {
    const role = await transaction.role.findUnique({
      where: { id: roleId },
      select: { isSystem: true },
    });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (role.isSystem) throw new BadRequestException('Los roles del sistema son inmutables');
  }

  private async assertAnotherAdministrator(
    transaction: Prisma.TransactionClient,
    employeeId: string,
  ): Promise<void> {
    const targetRole = await transaction.employeeRole.count({
      where: { employeeId, role: { code: EmployeeRoleCode.ADMINISTRATOR } },
    });
    if (!targetRole) return;
    const others = await transaction.employeeRole.count({
      where: {
        employeeId: { not: employeeId },
        role: { code: EmployeeRoleCode.ADMINISTRATOR },
        employee: { status: EmployeeStatus.ACTIVE },
      },
    });
    if (!others)
      throw new BadRequestException('No se puede retirar el último administrador activo');
  }

  private toRoleDto(role: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    permissions: { permission: { code: string } }[];
  }): RoleDto {
    return {
      id: role.id,
      code: role.code,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map(({ permission }) => permission.code).sort(),
    };
  }

  private toEmployeeDto(employee: EmployeeRecord): EmployeeSummaryDto {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      corporateEmail: employee.corporateEmail,
      firstName: employee.firstName,
      lastName: employee.lastName,
      jobTitle: employee.jobTitle,
      department: employee.department,
      status: employee.status,
      lastLoginAt: employee.lastLoginAt,
      roles: employee.roles.map(({ role }) => role.code).sort(),
      permissions: [
        ...new Set(
          employee.roles.flatMap(({ role }) =>
            role.permissions.map(({ permission }) => permission.code),
          ),
        ),
      ].sort(),
    };
  }

  private isUniqueConflict(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
