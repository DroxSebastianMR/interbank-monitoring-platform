import type { Prisma } from '@prisma/client';
import { PublicNoticeKind as Kind } from '@/modules/public-status/enums/public-notice.enum';
import { PUBLIC_SERVICES, PUBLIC_TEMPLATE_VERSION, publicNoticeText, publicState } from '@/modules/public-status/policies/public-notice.policy';

export type NoticeInput = {
  serviceKey: string; serviceVersion: number; technicalStatus: string; kind: Kind; deduplicationKey: string;
  incidentId?: string; occurrence?: number; approvedById?: string; approvalReason?: string;
};

/** Caller holds the monitored-service row lock. Queue and source transition commit together. */
export async function queuePublicNotice(tx: Prisma.TransactionClient, input: NoticeInput) {
  if (!Object.hasOwn(PUBLIC_SERVICES, input.serviceKey)) return null;
  const existing = await tx.statusPublication.findUnique({ where: { deduplicationKey: input.deduplicationKey } });
  if (existing) return existing;
  await tx.publicServiceStatus.upsert({ where: { serviceKey: input.serviceKey },
    create: { serviceKey: input.serviceKey }, update: {} });
  const state = await tx.publicServiceStatus.update({ where: { serviceKey: input.serviceKey }, data: { nextSequence: { increment: 1 } } });
  return tx.statusPublication.create({ data: {
    serviceKey: input.serviceKey, sequence: state.nextSequence, deduplicationKey: input.deduplicationKey,
    incidentId: input.incidentId, occurrence: input.occurrence, sourceServiceVersion: input.serviceVersion,
    sourceTechnicalStatus: input.technicalStatus, kind: input.kind, status: publicState(input.technicalStatus),
    templateVersion: PUBLIC_TEMPLATE_VERSION, ...publicNoticeText(input.serviceKey, input.kind, input.technicalStatus),
    approvedById: input.approvedById, approvalReason: input.approvalReason,
    expiresAt: input.kind === Kind.PREVENTIVE ? new Date(Date.now() + 300_000) : null,
  } });
}
