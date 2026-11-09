import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationItem } from '@/features/notifications/components/notification-item';
import type { Notification } from '@/features/notifications/types/notification.types';

const item: Notification = {
  id: 'notice', incidentId: 'incident', eventType: 'incident.created',
  createdAt: '2026-11-09T10:00:00.000Z', readAt: null,
  incident: { id: 'incident', serviceKey: 'login', title: 'Afectación confirmada',
    severity: 'HIGH', status: 'OPEN', attentionState: 'INVESTIGATING' },
};
afterEach(cleanup);

describe('Notification item', () => {
  it('preserves navigation context without implicitly marking a notification as read', () => {
    const onRead = vi.fn(); const onNavigate = vi.fn();
    render(<MemoryRouter><ul><NotificationItem item={item} pending={false} disabled={false}
      search="?period=1h&service=login" onRead={onRead} onNavigate={onNavigate} /></ul></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'Ver expediente' });
    expect(link).toHaveAttribute('href', '/incidents/incident?period=1h&service=login');
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledOnce();
    expect(onRead).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como leída' }));
    expect(onRead).toHaveBeenCalledWith('notice');
  });

  it('keeps a missing reference visible without creating a broken incident link', () => {
    render(<MemoryRouter><ul><NotificationItem item={{ ...item, incident: null }} pending={false}
      disabled={false} search="" onRead={vi.fn()} onNavigate={vi.fn()} /></ul></MemoryRouter>);
    expect(screen.getByText('El expediente relacionado ya no está disponible.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
