import { describe, expect, it } from 'vitest';
import { ApiError } from '@/infrastructure/api/client/axios.interceptors';
import { notificationAccessBlocked, notificationError } from '@/features/notifications/utils/notification-error';

describe('Notification API errors', () => {
  it('recognizes disabled delivery after the shared Axios interceptor normalizes the error', () => {
    const disabled = new ApiError(503, 'Operational inbox is not enabled');
    expect(notificationError(disabled)).toBe('disabled');
    expect(notificationAccessBlocked(disabled)).toBe(true);
    expect(notificationError(new ApiError(503, 'Service temporarily unavailable'))).toBe('unavailable');
  });

  it.each([[401, 'unauthorized'], [403, 'forbidden'], [404, 'not-available'], [400, 'invalid-cursor']] as const)(
    'distinguishes HTTP %s as %s', (status, expected) => {
      expect(notificationError(new ApiError(status, 'request failed'))).toBe(expected);
    });

  it('keeps connection and contract failures distinct from an empty result', () => {
    expect(notificationError(new ApiError(0, 'connection failed'))).toBe('unavailable');
    expect(notificationError(new Error('invalid response'))).toBe('unavailable');
    expect(notificationError(null)).toBeNull();
  });
});
