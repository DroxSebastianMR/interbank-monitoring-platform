import { EmployeeStatus, PrismaClient } from '@prisma/client';

import { hashPassword } from '@/common/security/password-hasher';
import { EmployeeRoleCode } from '@/modules/auth/enums/employee-role-code.enum';
import { PermissionCode } from '@/modules/auth/enums/permission-code.enum';

const prisma = new PrismaClient();

const permissions = [
  [PermissionCode.DASHBOARD_READ, 'dashboard', 'read', 'Consultar el resumen operativo'],
  [PermissionCode.SERVICES_READ, 'services', 'read', 'Consultar servicios monitoreados'],
  [PermissionCode.SERVICES_MANAGE, 'services', 'manage', 'Administrar servicios monitoreados'],
  [PermissionCode.INCIDENTS_READ, 'incidents', 'read', 'Consultar incidentes'],
  [PermissionCode.INCIDENTS_MANAGE, 'incidents', 'manage', 'Gestionar incidentes'],
  [PermissionCode.ALERTS_READ, 'alerts', 'read', 'Consultar alertas'],
  [
    PermissionCode.NOTIFICATIONS_MANAGE,
    'notifications',
    'manage',
    'Administrar comunicaciones operativas',
  ],
  [PermissionCode.ANALYTICS_READ, 'analytics', 'read', 'Consultar métricas y analítica'],
  [PermissionCode.ACCESS_CONTROL_READ, 'access-control', 'read', 'Consultar roles y permisos'],
  [
    PermissionCode.ACCESS_CONTROL_MANAGE,
    'access-control',
    'manage',
    'Administrar roles de empleados',
  ],
  [PermissionCode.AUDIT_READ, 'audit', 'read', 'Consultar trazabilidad y auditoría'],
] as const;

const roleDefinitions: Record<
  EmployeeRoleCode,
  { name: string; description: string; permissions: PermissionCode[] }
> = {
  [EmployeeRoleCode.ADMINISTRATOR]: {
    name: 'Administrador',
    description: 'Administración integral de la plataforma y del acceso interno.',
    permissions: Object.values(PermissionCode),
  },
  [EmployeeRoleCode.IT_ENGINEER]: {
    name: 'Ingeniería TI',
    description: 'Operación técnica, diagnóstico y gestión de servicios e incidentes.',
    permissions: [
      PermissionCode.DASHBOARD_READ,
      PermissionCode.SERVICES_READ,
      PermissionCode.SERVICES_MANAGE,
      PermissionCode.INCIDENTS_READ,
      PermissionCode.INCIDENTS_MANAGE,
      PermissionCode.ALERTS_READ,
      PermissionCode.ANALYTICS_READ,
      PermissionCode.AUDIT_READ,
    ],
  },
  [EmployeeRoleCode.OPERATOR]: {
    name: 'Operador',
    description: 'Seguimiento diario y atención del ciclo de incidentes.',
    permissions: [
      PermissionCode.DASHBOARD_READ,
      PermissionCode.SERVICES_READ,
      PermissionCode.INCIDENTS_READ,
      PermissionCode.INCIDENTS_MANAGE,
      PermissionCode.ALERTS_READ,
      PermissionCode.NOTIFICATIONS_MANAGE,
    ],
  },
  [EmployeeRoleCode.AUDITOR]: {
    name: 'Auditor',
    description: 'Acceso de solo lectura a operación, métricas y trazabilidad.',
    permissions: [
      PermissionCode.DASHBOARD_READ,
      PermissionCode.SERVICES_READ,
      PermissionCode.INCIDENTS_READ,
      PermissionCode.ALERTS_READ,
      PermissionCode.ANALYTICS_READ,
      PermissionCode.ACCESS_CONTROL_READ,
      PermissionCode.AUDIT_READ,
    ],
  },
};

async function seedAccessControl(): Promise<void> {
  for (const [code, resource, action, description] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { resource, action, description },
      create: { code, resource, action, description },
    });
  }

  for (const [code, definition] of Object.entries(roleDefinitions)) {
    const role = await prisma.role.upsert({
      where: { code },
      update: { name: definition.name, description: definition.description },
      create: { code, name: definition.name, description: definition.description },
    });
    const grantedPermissions = await prisma.permission.findMany({
      where: { code: { in: definition.permissions } },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: role.id } }),
      prisma.rolePermission.createMany({
        data: grantedPermissions.map(({ id }) => ({ roleId: role.id, permissionId: id })),
      }),
    ]);
  }
}

async function seedAdministrator(): Promise<void> {
  const employeeCode = process.env.DASHBOARD_ADMIN_EMPLOYEE_CODE;
  const corporateEmail = process.env.DASHBOARD_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DASHBOARD_ADMIN_PASSWORD;
  if (!employeeCode || !corporateEmail || !password) {
    process.stdout.write(
      'Admin seed skipped: configure DASHBOARD_ADMIN_EMPLOYEE_CODE, DASHBOARD_ADMIN_EMAIL and DASHBOARD_ADMIN_PASSWORD.\n',
    );
    return;
  }
  if (password.length < 12) {
    throw new Error('DASHBOARD_ADMIN_PASSWORD must contain at least 12 characters');
  }

  const passwordHash = await hashPassword(password);
  const employee = await prisma.employee.upsert({
    where: { corporateEmail },
    update: {
      employeeCode,
      passwordHash,
      firstName: process.env.DASHBOARD_ADMIN_FIRST_NAME || 'Administrador',
      lastName: process.env.DASHBOARD_ADMIN_LAST_NAME || 'Monitoreo',
      jobTitle: 'Administrador de plataforma',
      department: 'Tecnología de la Información',
      status: EmployeeStatus.ACTIVE,
      failedLoginAttempts: 0,
      lockedUntil: null,
      passwordChangedAt: new Date(),
    },
    create: {
      employeeCode,
      corporateEmail,
      passwordHash,
      firstName: process.env.DASHBOARD_ADMIN_FIRST_NAME || 'Administrador',
      lastName: process.env.DASHBOARD_ADMIN_LAST_NAME || 'Monitoreo',
      jobTitle: 'Administrador de plataforma',
      department: 'Tecnología de la Información',
    },
  });
  const administratorRole = await prisma.role.findUniqueOrThrow({
    where: { code: EmployeeRoleCode.ADMINISTRATOR },
  });
  await prisma.employeeRole.upsert({
    where: {
      employeeId_roleId: { employeeId: employee.id, roleId: administratorRole.id },
    },
    update: {},
    create: { employeeId: employee.id, roleId: administratorRole.id },
  });
}

async function seedMonitoredServices(): Promise<void> {
  for (const [name, endpoint] of [
    ['Login', '/health'],
    ['Balance', '/health'],
    ['Transfers', '/health'],
  ] as const) {
    const existing = await prisma.monitoredService.findFirst({ where: { name } });
    if (existing) {
      await prisma.monitoredService.update({ where: { id: existing.id }, data: { endpoint } });
    } else {
      await prisma.monitoredService.create({ data: { name, endpoint } });
    }
  }
}

async function main(): Promise<void> {
  await seedAccessControl();
  await seedAdministrator();
  await seedMonitoredServices();
}

void main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Seed failed: ${message}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
