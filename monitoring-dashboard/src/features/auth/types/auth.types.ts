export interface Employee {
  id: string;
  corporateEmail: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  authenticated: true;
  tokens: { accessToken: string; refreshToken: string };
  employee: Employee;
}
