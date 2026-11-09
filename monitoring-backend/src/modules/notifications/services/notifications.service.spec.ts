import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationsService } from '@/modules/notifications/services/notifications.service';

const employeeId = 'employee-a';
const createdAt = new Date('2026-11-09T10:00:00.000Z');
const notice = (id: string, incidentId = 'incident-a') => ({
  id, incidentId, eventType: 'incident.created', createdAt, readAt: null,
});

function fixture(enabled = true) {
  const db = {
    notification: {
      count: jest.fn().mockResolvedValue(140),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
    },
    incident: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const config = new ConfigService({ MONITORING_DELIVERY_ENABLED: String(enabled) });
  return { db, service: new NotificationsService(db as unknown as PrismaService, config) };
}

describe('Notifications inbox', () => {
  it('counts unread items beyond the legacy 100-row limit for the current employee only', async () => {
    const { db, service } = fixture();
    await expect(service.unreadCount(employeeId)).resolves.toEqual({ unreadCount: 140 });
    expect(db.notification.count).toHaveBeenCalledWith({ where: { employeeId, readAt: null } });
    expect(db.notification.findMany).not.toHaveBeenCalled();
  });

  it('uses one look-ahead item and batches only the returned incident references', async () => {
    const { db, service } = fixture();
    db.notification.findMany.mockResolvedValue([notice('c'), notice('b'), notice('a', 'other-incident')]);
    const summary = { id: 'incident-a', serviceKey: 'login', title: 'Afectación confirmada',
      status: 'OPEN', severity: 'HIGH', attentionState: 'INVESTIGATING' };
    db.incident.findMany.mockResolvedValue([summary]);
    const page = await service.inbox(employeeId, { limit: 2 });
    expect(page).toEqual({ items: [
      { ...notice('c'), incident: summary }, { ...notice('b'), incident: summary },
    ], nextCursor: 'b' });
    expect(db.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { employeeId }, take: 3, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }));
    expect(db.incident.findMany).toHaveBeenCalledTimes(1);
    expect(db.incident.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: ['incident-a'] } },
    }));
  });

  it('keeps a strict date/id boundary when notifications share a timestamp', async () => {
    const { db, service } = fixture();
    db.notification.findFirst.mockResolvedValue({ id: 'b', createdAt });
    await service.inbox(employeeId, { limit: 20, cursor: 'b' });
    expect(db.notification.findFirst).toHaveBeenCalledWith({
      where: { id: 'b', employeeId }, select: { id: true, createdAt: true },
    });
    expect(db.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { employeeId, OR: [
        { createdAt: { lt: createdAt } }, { createdAt, id: { lt: 'b' } },
      ] },
    }));
  });

  it('rejects absent or foreign cursors before fetching a page', async () => {
    const { db, service } = fixture();
    await expect(service.inbox(employeeId, { limit: 20, cursor: 'foreign' })).rejects.toBeInstanceOf(BadRequestException);
    expect(db.notification.findMany).not.toHaveBeenCalled();
    expect(db.incident.findMany).not.toHaveBeenCalled();
  });

  it('preserves a notification with a missing incident and ends the last page', async () => {
    const { db, service } = fixture();
    db.notification.findMany.mockResolvedValue([notice('only')]);
    await expect(service.inbox(employeeId, { limit: 20 })).resolves.toEqual({
      items: [{ ...notice('only'), incident: null }], nextCursor: null,
    });
  });

  it('returns an empty page without querying incidents', async () => {
    const { db, service } = fixture();
    await expect(service.inbox(employeeId, { limit: 20 })).resolves.toEqual({ items: [], nextCursor: null });
    expect(db.incident.findMany).not.toHaveBeenCalled();
  });

  it('distinguishes disabled delivery and database failures from an empty inbox', async () => {
    const disabled = fixture(false);
    await expect(disabled.service.unreadCount(employeeId)).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(disabled.service.inbox(employeeId, { limit: 20 })).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(disabled.db.notification.count).not.toHaveBeenCalled();
    const enabled = fixture();
    const failure = new Error('database unavailable');
    enabled.db.notification.count.mockRejectedValue(failure);
    await expect(enabled.service.unreadCount(employeeId)).rejects.toBe(failure);
  });
});
