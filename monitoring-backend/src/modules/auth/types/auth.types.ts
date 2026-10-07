export interface EmployeeAccessProfile {
  id: string;
  employeeCode: string;
  corporateEmail: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  department: string | null;
  roles: string[];
  permissions: string[];
}

export interface EmployeePrincipal extends EmployeeAccessProfile {
  sessionId: string;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  sessionId: string;
  type: 'access';
}

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface HttpRequest {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface AuthenticatedRequest extends HttpRequest {
  user: EmployeePrincipal;
}
