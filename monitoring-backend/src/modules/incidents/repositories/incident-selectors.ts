export const incidentPeople = {
  assignee: { select: { id: true, employeeCode: true, firstName: true, lastName: true, status: true } },
  acknowledgedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

export const eligibleAssignee = {
  status: 'ACTIVE',
  AND: ['incidents.manage', 'incidents.read'].map((code) => ({
    roles: { some: { role: { permissions: { some: { permission: { code } } } } } },
  })),
} as const;
