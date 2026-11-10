import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/app/providers/auth/auth-context';
import { NotificationBell } from '@/features/notifications/components/notification-bell';

afterEach(cleanup);
describe('Notification visibility', () => {
  it.each([{ permissions: ['incidents.read'] }, { permissions: ['notifications.read'] }, { permissions: [] }])(
    'hides the bell without both permissions ($permissions)', ({ permissions }) => {
      render(<AuthContext.Provider value={{
        employee: { id: 'employee', corporateEmail: 'operator@example.test', firstName: 'Ana',
          lastName: 'Ríos', roles: [], permissions }, isLoading: false, signIn: vi.fn(), signOut: vi.fn(),
      }}><MemoryRouter><NotificationBell /></MemoryRouter></AuthContext.Provider>);
      expect(screen.queryByRole('button', { name: /Notificaciones/ })).not.toBeInTheDocument();
    });
});
