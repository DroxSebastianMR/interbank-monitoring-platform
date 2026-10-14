import { BadRequestException } from '@nestjs/common';
import { EmployeeStatus } from '@prisma/client';

import { AccessControlRepository } from '@/modules/access-control/repositories/access-control.repository';
import type { EmployeePrincipal } from '@/modules/auth/types/auth.types';
import type { PrismaService } from '@/common/prisma/prisma.service';

const actor = { id: 'employee-1', roles: ['ADMINISTRATOR'] } as EmployeePrincipal;

describe('AccessControlRepository security invariants', () => {
  it('does not allow editing a system role', async () => {
    const transaction = {
      role: { findUnique: jest.fn().mockResolvedValue({ isSystem: true }), update: jest.fn() },
      rolePermission: { deleteMany: jest.fn() },
    };
    const prisma = {
      permission: { findMany: jest.fn().mockResolvedValue([{ id: 'permission-1' }]) },
      $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const repository = new AccessControlRepository(prisma as unknown as PrismaService);

    await expect(
      repository.updateRole(
        'role-1',
        {
          name: 'Nuevo nombre',
          permissionCodes: ['dashboard.read'],
        },
        actor,
        {},
      ),
    ).rejects.toThrow(BadRequestException);
    expect(transaction.role.update).not.toHaveBeenCalled();
    expect(transaction.rolePermission.deleteMany).not.toHaveBeenCalled();
  });

  it('does not disable the final active administrator', async () => {
    const transaction = {
      employee: {
        findUnique: jest.fn().mockResolvedValue({ status: EmployeeStatus.ACTIVE }),
        update: jest.fn(),
      },
      employeeRole: { count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof transaction) => unknown) =>
        callback(transaction),
      ),
    };
    const repository = new AccessControlRepository(prisma as unknown as PrismaService);

    await expect(
      repository.updateEmployeeStatus('employee-2', EmployeeStatus.DISABLED, actor, {}),
    ).rejects.toThrow(BadRequestException);
    expect(transaction.employee.update).not.toHaveBeenCalled();
  });
});
