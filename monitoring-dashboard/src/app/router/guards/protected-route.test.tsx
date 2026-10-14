import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@/app/providers/auth/auth-context';
import { ProtectedRoute } from '@/app/router/guards/protected-route';
import type { Employee } from '@/features/auth/types/auth.types';

const employee: Employee = {
  id: 'test', corporateEmail: 'operator@example.test', firstName: 'Ana', lastName: 'Ríos',
  roles: ['OPERATOR'], permissions: ['dashboard.read'],
};

function renderRoute(current: Employee | null, isLoading = false) {
  return render(<AuthContext.Provider value={{ employee: current, isLoading, signIn: vi.fn(), signOut: vi.fn() }}>
    <MemoryRouter initialEntries={['/services']}>
      <Routes>
        <Route path="/login" element={<p>Login</p>} />
        <Route element={<ProtectedRoute />}><Route path="/services" element={<p>Servicios privados</p>} /></Route>
      </Routes>
    </MemoryRouter>
  </AuthContext.Provider>);
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated employees', () => {
    renderRoute(null);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
  it('keeps private content hidden while session validation runs', () => {
    renderRoute(employee, true);
    expect(screen.getByText('Validando sesión…')).toBeInTheDocument();
    expect(screen.queryByText('Servicios privados')).not.toBeInTheDocument();
  });
  it('renders the nested outlet for an authenticated employee', () => {
    renderRoute(employee);
    expect(screen.getByText('Servicios privados')).toBeInTheDocument();
  });
});
