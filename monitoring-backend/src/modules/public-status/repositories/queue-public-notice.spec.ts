import type { Prisma } from '@prisma/client';
import { queuePublicNotice } from '@/modules/public-status/repositories/queue-public-notice';
import { PublicNoticeKind } from '@/modules/public-status/enums/public-notice.enum';

describe('Durable notice scheduling', () => {
  it('reuses a notice and its sequence for a repeated source event', async () => {
    let saved: Prisma.StatusPublicationUncheckedCreateInput | null = null;
    const tx = {
      statusPublication: {
        findUnique: jest.fn(() => Promise.resolve(saved)),
        create: jest.fn(({ data }: { data: Prisma.StatusPublicationUncheckedCreateInput }) => { saved = data; return Promise.resolve(data); }),
      },
      publicServiceStatus: { upsert: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({ nextSequence: 1 }) },
    };
    const input = { serviceKey: 'login', serviceVersion: 1, technicalStatus: 'UNAVAILABLE', kind: PublicNoticeKind.INITIAL, deduplicationKey: 'incident:1:INITIAL:c1' };
    await queuePublicNotice(tx as unknown as Prisma.TransactionClient, input);
    await queuePublicNotice(tx as unknown as Prisma.TransactionClient, input);
    expect(tx.statusPublication.create).toHaveBeenCalledTimes(1);
    expect(tx.publicServiceStatus.update).toHaveBeenCalledTimes(1);
  });
  it('does not schedule public content for an internal-only service', async () => {
    const create = jest.fn();
    const tx = { statusPublication: { create } } as unknown as Prisma.TransactionClient;
    expect(await queuePublicNotice(tx, { serviceKey: 'private-node', serviceVersion: 1, technicalStatus: 'UNAVAILABLE', kind: PublicNoticeKind.INITIAL, deduplicationKey: 'private' })).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });
});
