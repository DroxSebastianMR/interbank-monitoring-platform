import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { NotificationInboxQueryDto } from '@/modules/notifications/dto/notification-inbox-query.dto';

describe('Notification inbox query', () => {
  it('defaults to 20 and converts a valid numeric query parameter', () => {
    expect(plainToInstance(NotificationInboxQueryDto, {}).limit).toBe(20);
    const query = plainToInstance(NotificationInboxQueryDto, { limit: '50' });
    expect(query.limit).toBe(50);
    expect(validateSync(query)).toEqual([]);
  });

  it.each(['0', '-1', '51', '1.5', 'invalid', ''])('rejects invalid limit %s', (limit) => {
    expect(validateSync(plainToInstance(NotificationInboxQueryDto, { limit })).length).toBeGreaterThan(0);
  });

  it('rejects malformed cursors', () => {
    expect(validateSync(plainToInstance(NotificationInboxQueryDto, { cursor: 'not-a-uuid' })).length).toBeGreaterThan(0);
  });
});
