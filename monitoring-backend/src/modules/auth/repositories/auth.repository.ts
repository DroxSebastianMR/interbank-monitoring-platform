import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/common/prisma/prisma.service';
import { AuditAction } from '@/modules/auth/enums/audit-action.enum';
import type { EmployeeAccessProfile, RequestMetadata } from '@/modules/auth/types/auth.types';
import type { SessionDto } from '@/modules/auth/dto/auth-response.dto';

const EMPLOYEE_ACCESS_INCLUDE = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} satisfies Prisma.EmployeeInclude;

const EMPLOYEE_ACCESS_SELECT = {
  id: true,
  employeeCode: true,
  corporateEmail: true,
  firstName: true,
  lastName: true,
  jobTitle: true,
  department: true,
  lockedUntil: true,
  roles: EMPLOYEE_ACCESS_INCLUDE.roles,
} satisfies Prisma.EmployeeSelect;

type EmployeeAccessRecord = Prisma.EmployeeGetPayload<{
  select: typeof EMPLOYEE_ACCESS_SELECT;
}>;

type EmployeeLoginRecord = Prisma.EmployeeGetPayload<{ include: typeof EMPLOYEE_ACCESS_INCLUDE }>;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCorporateEmail(corporateEmail: string): Promise<EmployeeLoginRecord | null> {
    return this.prisma.employee.findUnique({
      where: { corporateEmail },
      include: EMPLOYEE_ACCESS_INCLUDE,
    });
  }

  async findEmployeeById(employeeId: string): Promise<EmployeeAccessProfile | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: EMPLOYEE_ACCESS_SELECT,
    });
    return employee ? this.toAccessProfile(employee) : null;
  }

  async recordFailedLogin(
    employeeId: string,
    maxFailedAttempts: number,
    lockMinutes: number,
    metadata: RequestMetadata,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const employee = await transaction.employee.update({
        where: { id: employeeId },
        data: { failedLoginAttempts: { increment: 1 } },
        select: { failedLoginAttempts: true },
      });
      const lockedUntil =
        employee.failedLoginAttempts >= maxFailedAttempts
          ? new Date(Date.now() + lockMinutes * 60_000)
          : null;
      if (lockedUntil) {
        await transaction.employee.update({
          where: { id: employeeId },
          data: { lockedUntil },
        });
      }
      await transaction.auditLog.create({
        data: {
          actorId: employeeId,
          action: AuditAction.LOGIN_FAILED,
          resource: 'auth-session',
          outcome: 'FAILURE',
          ipAddress: metadata.ipAddress,
          metadata: lockedUntil ? { lockedUntil: lockedUntil.toISOString() } : undefined,
        },
      });
    });
  }

  async createSession(
    sessionId: string,
    employeeId: string,
    refreshTokenHash: string,
    expiresAt: Date,
    metadata: RequestMetadata,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.employee.update({
        where: { id: employeeId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      }),
      this.prisma.authSession.create({
        data: {
          id: sessionId,
          employeeId,
          refreshTokenHash,
          expiresAt,
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: employeeId,
          action: AuditAction.LOGIN_SUCCEEDED,
          resource: 'auth-session',
          resourceId: sessionId,
          outcome: 'SUCCESS',
          ipAddress: metadata.ipAddress,
        },
      }),
    ]);
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<{
    sessionId: string;
    employee: EmployeeAccessProfile;
  } | null> {
    const session = await this.prisma.authSession.findFirst({
      where: {
        refreshTokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        employee: { status: EmployeeStatus.ACTIVE },
      },
      include: {
        employee: { select: EMPLOYEE_ACCESS_SELECT },
      },
    });

    if (!session || this.isTemporarilyLocked(session.employee.lockedUntil)) return null;
    return {
      sessionId: session.id,
      employee: this.toAccessProfile(session.employee),
    };
  }

  async rotateSession(
    sessionId: string,
    currentRefreshTokenHash: string,
    nextRefreshTokenHash: string,
    expiresAt: Date,
    metadata: RequestMetadata,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.authSession.updateMany({
        where: {
          id: sessionId,
          refreshTokenHash: currentRefreshTokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          refreshTokenHash: nextRefreshTokenHash,
          expiresAt,
          lastUsedAt: new Date(),
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        },
      });

      if (updated.count !== 1) return false;

      const session = await transaction.authSession.findUniqueOrThrow({
        where: { id: sessionId },
        select: { employeeId: true },
      });
      await transaction.auditLog.create({
        data: {
          actorId: session.employeeId,
          action: AuditAction.SESSION_REFRESHED,
          resource: 'auth-session',
          resourceId: sessionId,
          outcome: 'SUCCESS',
          ipAddress: metadata.ipAddress,
        },
      });
      return true;
    });
  }

  async findPrincipalBySession(
    sessionId: string,
    employeeId: string,
  ): Promise<EmployeeAccessProfile | null> {
    const session = await this.prisma.authSession.findFirst({
      where: {
        id: sessionId,
        employeeId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        employee: { status: EmployeeStatus.ACTIVE },
      },
      include: {
        employee: { select: EMPLOYEE_ACCESS_SELECT },
      },
    });

    if (!session || this.isTemporarilyLocked(session.employee.lockedUntil)) return null;
    return this.toAccessProfile(session.employee);
  }

  async revokeSession(
    sessionId: string,
    employeeId: string,
    metadata: RequestMetadata,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.authSession.updateMany({
        where: { id: sessionId, employeeId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await transaction.auditLog.create({
        data: {
          actorId: employeeId,
          action: AuditAction.LOGOUT,
          resource: 'auth-session',
          resourceId: sessionId,
          outcome: 'SUCCESS',
          ipAddress: metadata.ipAddress,
        },
      });
    });
  }

  async listActiveSessions(employeeId: string, currentSessionId: string): Promise<SessionDto[]> {
    const sessions = await this.prisma.authSession.findMany({
      where: { employeeId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
      },
    });
    return sessions.map((session) => ({ ...session, current: session.id === currentSessionId }));
  }

  async revokeOwnSession(
    employeeId: string,
    sessionId: string,
    metadata: RequestMetadata,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.authSession.updateMany({
        where: { id: sessionId, employeeId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (result.count !== 1) throw new NotFoundException('Sesión activa no encontrada');
      await transaction.auditLog.create({
        data: {
          actorId: employeeId,
          action: AuditAction.SESSION_REVOKED,
          resource: 'auth-session',
          resourceId: sessionId,
          outcome: 'SUCCESS',
          ipAddress: metadata.ipAddress,
        },
      });
    });
  }

  async revokeAllSessions(employeeId: string, metadata: RequestMetadata): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.authSession.updateMany({
        where: { employeeId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: employeeId,
          action: AuditAction.ALL_SESSIONS_REVOKED,
          resource: 'auth-session',
          outcome: 'SUCCESS',
          ipAddress: metadata.ipAddress,
        },
      }),
    ]);
  }

  async findPasswordHash(employeeId: string): Promise<string | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { passwordHash: true },
    });
    return employee?.passwordHash ?? null;
  }

  async updatePasswordAndRevokeSessions(
    employeeId: string,
    passwordHash: string,
    metadata: RequestMetadata,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.employee.update({
        where: { id: employeeId },
        data: { passwordHash, passwordChangedAt: new Date() },
      }),
      this.prisma.authSession.updateMany({
        where: { employeeId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: employeeId,
          action: AuditAction.PASSWORD_CHANGED,
          resource: 'employee',
          resourceId: employeeId,
          outcome: 'SUCCESS',
          ipAddress: metadata.ipAddress,
        },
      }),
    ]);
  }

  toAccessProfile(employee: EmployeeAccessRecord): EmployeeAccessProfile {
    const roles = employee.roles.map(({ role }) => role.code).sort();
    const permissions = [
      ...new Set(
        employee.roles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.code),
        ),
      ),
    ].sort();

    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      corporateEmail: employee.corporateEmail,
      firstName: employee.firstName,
      lastName: employee.lastName,
      jobTitle: employee.jobTitle,
      department: employee.department,
      roles,
      permissions,
    };
  }

  private isTemporarilyLocked(lockedUntil: Date | null): boolean {
    return Boolean(lockedUntil && lockedUntil.getTime() > Date.now());
  }
}
