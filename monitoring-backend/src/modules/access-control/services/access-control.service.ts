import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { EmployeeStatus } from '@prisma/client';

import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { PasswordService } from '@/modules/auth/services/password.service';
import { EmployeeRoleCode } from '@/modules/auth/enums/employee-role-code.enum';
import type { EmployeePrincipal, RequestMetadata } from '@/modules/auth/types/auth.types';
import type {
  EmployeeRolesUpdatedDto,
  EmployeeSummaryDto,
  PermissionDto,
  RoleDto,
} from '@/modules/access-control/dto/access-control-response.dto';
import type { CreateEmployeeDto } from '@/modules/access-control/dto/create-employee.dto';
import type { CreateRoleDto, UpdateRoleDto } from '@/modules/access-control/dto/create-role.dto';
import { AccessControlRepository } from '@/modules/access-control/repositories/access-control.repository';
import { RedisService } from '@/redis/redis.service';
import { AuthPrincipalCacheService } from '@/modules/auth/services/auth-principal-cache.service';

const CATALOG_TTL_SECONDS = 60;
const ROLES_CACHE_KEY = 'monitoring:access-control:roles:v1';
const PERMISSIONS_CACHE_KEY = 'monitoring:access-control:permissions:v1';

@Injectable()
export class AccessControlService {
  constructor(
    private readonly repository: AccessControlRepository,
    private readonly authRepository: AuthRepository,
    private readonly passwords: PasswordService,
    private readonly redis: RedisService,
    private readonly principalCache: AuthPrincipalCacheService,
  ) {}

  roles(): Promise<RoleDto[]> {
    return this.cachedCatalog(ROLES_CACHE_KEY, () => this.repository.findRoles());
  }

  permissions(): Promise<PermissionDto[]> {
    return this.cachedCatalog(PERMISSIONS_CACHE_KEY, () => this.repository.findPermissions());
  }

  role(roleId: string): Promise<RoleDto> {
    return this.repository.findRole(roleId);
  }

  async createRole(
    input: CreateRoleDto,
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<RoleDto> {
    this.ensureAdministrator(actor);
    const result = await this.repository.createRole(input, actor, metadata);
    await this.clearRoleCatalog();
    return result;
  }

  async updateRole(
    roleId: string,
    input: UpdateRoleDto,
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<RoleDto> {
    this.ensureAdministrator(actor);
    const result = await this.repository.updateRole(roleId, input, actor, metadata);
    await this.clearRoleCatalog();
    return result;
  }

  async deleteRole(
    roleId: string,
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<void> {
    this.ensureAdministrator(actor);
    await this.repository.deleteRole(roleId, actor, metadata);
    await this.clearRoleCatalog();
  }

  employees(page: number, limit: number): Promise<EmployeeSummaryDto[]> {
    return this.repository.findEmployees((page - 1) * limit, limit);
  }

  employee(employeeId: string): Promise<EmployeeSummaryDto> {
    return this.repository.findEmployee(employeeId);
  }

  async createEmployee(
    input: CreateEmployeeDto,
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<EmployeeSummaryDto> {
    this.ensureAdministrator(actor);
    const passwordHash = await this.passwords.hash(input.password);
    return this.repository.createEmployee(input, passwordHash, actor, metadata);
  }

  async updateEmployeeStatus(
    employeeId: string,
    status: EmployeeStatus,
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<EmployeeSummaryDto> {
    this.ensureAdministrator(actor);
    const employee = await this.repository.updateEmployeeStatus(
      employeeId,
      status,
      actor,
      metadata,
    );
    await this.principalCache.invalidateEmployee(employeeId);
    return employee;
  }

  async assignRoles(
    employeeId: string,
    roleCodes: string[],
    actor: EmployeePrincipal,
    metadata: RequestMetadata,
  ): Promise<EmployeeRolesUpdatedDto> {
    this.ensureAdministrator(actor);
    await this.repository.replaceEmployeeRoles(employeeId, roleCodes, actor, metadata);
    await this.principalCache.invalidateEmployee(employeeId);
    const employee = await this.authRepository.findEmployeeById(employeeId);
    if (!employee) throw new NotFoundException('Empleado no encontrado');
    return employee;
  }

  private async cachedCatalog<T>(key: string, load: () => Promise<T[]>): Promise<T[]> {
    try {
      const cached = await this.redis.client.get(key);
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed as T[];
      }
    } catch {
      // Redis is an optimization; PostgreSQL remains authoritative.
    }
    const result = await load();
    try {
      await this.redis.client.set(key, JSON.stringify(result), 'EX', CATALOG_TTL_SECONDS);
    } catch {
      // A cache outage must not block access administration.
    }
    return result;
  }

  private async clearRoleCatalog(): Promise<void> {
    try {
      await this.redis.client.del(ROLES_CACHE_KEY);
    } catch {
      // At most one minute of stale catalog display; authorization reads PostgreSQL.
    }
  }

  private ensureAdministrator(actor: EmployeePrincipal): void {
    if (!actor.roles.includes(EmployeeRoleCode.ADMINISTRATOR)) {
      throw new ForbiddenException('Se requiere el rol de administrador');
    }
  }
}
