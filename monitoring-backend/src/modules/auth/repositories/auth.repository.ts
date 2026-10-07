import { Injectable } from '@nestjs/common';
import { EmployeeStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';
import { AuditAction } from '@/modules/auth/enums/audit-action.enum';
import type { EmployeeAccessProfile, RequestMetadata } from '@/modules/auth/types/auth.types';

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

type EmployeeAccessRecord = Prisma.EmployeeGetPayload<{
  include: typeof EMPLOYEE_ACCESS_INCLUDE;
}>;

type EmployeeLoginRecord = EmployeeAccessRecord & {
  passwordHash: string;
  status: EmployeeStatus;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};

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
      include: EMPLOYEE_ACCESS_INCLUDE,
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
        employee: { include: EMPLOYEE_ACCESS_INCLUDE },
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
        employee: { include: EMPLOYEE_ACCESS_INCLUDE },
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
