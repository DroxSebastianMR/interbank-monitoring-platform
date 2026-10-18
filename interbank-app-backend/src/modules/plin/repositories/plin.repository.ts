import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  AccountStatus,
  Currency,
  Prisma,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  TransferKind,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { PlinPolicy } from '@/modules/plin/policies/plin.policy';

export const PLIN_PAYMENT_INCLUDE = {
  transfer: { select: { operationNumber: true, destinationAccount: { select: { userId: true } } } },
} satisfies Prisma.PlinPaymentInclude;

export type PlinPaymentDetails = Prisma.PlinPaymentGetPayload<{
  include: typeof PLIN_PAYMENT_INCLUDE;
}>;

interface LockedAccount {
  id: string;
  userId: string;
  currency: Currency;
  status: AccountStatus;
  balance: Prisma.Decimal;
  accountNumber: string;
  allowsDebits: boolean;
}

interface LockedEnrollment {
  userId: string;
  phoneNumber: string;
  accountId: string;
  isActive: boolean;
}

@Injectable()
export class PlinRepository {
  constructor(private readonly prisma: PrismaService) {}

  enrollment(userId: string) {
    return this.prisma.plinEnrollment.findUnique({ where: { userId } });
  }

  favorites(userId: string) {
    return this.prisma.plinFavorite.findMany({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }, { phoneNumber: 'asc' }],
      take: 50,
    });
  }

  favorite(userId: string, phoneNumber: string) {
    return this.prisma.plinFavorite.findUnique({
      where: { userId_phoneNumber: { userId, phoneNumber } },
    });
  }

  saveFavorite(
    userId: string,
    phoneNumber: string,
    alias: string | null,
    preferredNetwork: string,
  ) {
    return this.prisma.plinFavorite.upsert({
      where: { userId_phoneNumber: { userId, phoneNumber } },
      create: { userId, phoneNumber, alias, preferredNetwork },
      update: { alias, preferredNetwork },
    });
  }

  removeFavorite(userId: string, phoneNumber: string) {
    return this.prisma.plinFavorite.deleteMany({ where: { userId, phoneNumber } });
  }

  sources(userId: string) {
    return this.prisma.account.findMany({
      where: {
        userId,
        currency: Currency.PEN,
        status: AccountStatus.ACTIVE,
        accountType: { allowsDebits: true },
      },
      select: { id: true, displayName: true, accountNumber: true, balance: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  enroll(userId: string, accountId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "app"."users" WHERE id = ${userId}::uuid FOR UPDATE`;
      const [profile, account] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { phoneNumber: true, phoneVerifiedAt: true },
        }),
        tx.account.findFirst({
          where: {
            id: accountId,
            userId,
            currency: Currency.PEN,
            status: AccountStatus.ACTIVE,
            accountType: { allowsDebits: true },
          },
          select: { id: true },
        }),
      ]);
      if (!profile?.phoneVerifiedAt || !profile.phoneNumber)
        throw new BadRequestException('Verifica tu celular antes de afiliarte');
      if (!account) throw new BadRequestException('Selecciona una cuenta propia activa en soles');
      return tx.plinEnrollment.upsert({
        where: { userId },
        create: { userId, phoneNumber: profile.phoneNumber, accountId },
        update: { phoneNumber: profile.phoneNumber, accountId, isActive: true },
      });
    });
  }

  disable(userId: string) {
    return this.prisma.plinEnrollment.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }

  recipient(phoneNumber: string) {
    return this.prisma.plinEnrollment.findFirst({
      where: {
        phoneNumber,
        isActive: true,
        account: { status: AccountStatus.ACTIVE, currency: Currency.PEN },
      },
      select: {
        userId: true,
        phoneNumber: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
  }

  findByKey(userId: string, idempotencyKey: string) {
    return this.prisma.plinPayment.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: PLIN_PAYMENT_INCLUDE,
    });
  }

  list(userId: string) {
    return this.prisma.plinPayment.findMany({
      where: { OR: [{ userId }, { transfer: { destinationAccount: { userId } } }] },
      include: PLIN_PAYMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  detail(userId: string, id: string) {
    return this.prisma.plinPayment.findFirst({
      where: { id, OR: [{ userId }, { transfer: { destinationAccount: { userId } } }] },
      include: PLIN_PAYMENT_INCLUDE,
    });
  }

  async send(
    userId: string,
    input: {
      fromAccountId: string;
      phoneNumber: string;
      amount: Prisma.Decimal;
      idempotencyKey: string;
      fingerprint: string;
    },
  ): Promise<{ payment: PlinPaymentDetails; replayed: boolean }> {
    const old = await this.findByKey(userId, input.idempotencyKey);
    if (old) return this.replay(old, input.fingerprint);
    try {
      return await this.prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`SET LOCAL lock_timeout = '1500ms'`;
          const enrollments = await tx.$queryRaw<LockedEnrollment[]>`
          SELECT "userId", "phoneNumber", "accountId", "isActive"
          FROM "app"."plin_enrollments"
          WHERE "userId" = ${userId}::uuid OR "phoneNumber" = ${input.phoneNumber}
          ORDER BY "userId" FOR UPDATE`;
          const sender = enrollments.find((e) => e.userId === userId && e.isActive);
          const recipient = enrollments.find(
            (e) => e.phoneNumber === input.phoneNumber && e.isActive,
          );
          if (!sender || !recipient)
            throw new NotFoundException('Afiliación o destinatario no disponible');
          if (recipient.userId === userId)
            throw new BadRequestException('No puedes enviarte dinero a ti mismo');
          if (sender.accountId !== input.fromAccountId)
            throw new BadRequestException('Usa la cuenta afiliada como origen');
          const repeated = await tx.plinPayment.findUnique({
            where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } },
            include: PLIN_PAYMENT_INCLUDE,
          });
          if (repeated) return this.replay(repeated, input.fingerprint);

          const today = await tx.plinPayment.aggregate({
            where: { userId, createdAt: { gte: PlinPolicy.peruDayStart() } },
            _sum: { amount: true },
          });
          if ((today._sum.amount ?? new Prisma.Decimal(0)).plus(input.amount).gt(2000))
            throw new BadRequestException('Límite diario de S/2,000 excedido');
          const accounts = await tx.$queryRaw<LockedAccount[]>`
          SELECT a.id, a."userId", a.currency, a.status, a.balance, a."accountNumber", t."allowsDebits"
          FROM "app"."accounts" a JOIN "app"."account_types" t ON t.id = a."accountTypeId"
          WHERE a.id IN (${sender.accountId}::uuid, ${recipient.accountId}::uuid)
          ORDER BY a.id FOR UPDATE OF a`;
          const from = accounts.find((a) => a.id === sender.accountId);
          const to = accounts.find((a) => a.id === recipient.accountId);
          if (
            !from ||
            !to ||
            from.userId !== userId ||
            to.userId !== recipient.userId ||
            from.status !== AccountStatus.ACTIVE ||
            to.status !== AccountStatus.ACTIVE ||
            from.currency !== Currency.PEN ||
            to.currency !== Currency.PEN ||
            !from.allowsDebits ||
            !to.allowsDebits
          )
            throw new BadRequestException('Una cuenta afiliada no está disponible');
          if (from.balance.lt(input.amount)) throw new BadRequestException('Saldo insuficiente');
          if (to.balance.plus(input.amount).gt('999999999999.99'))
            throw new BadRequestException('La cuenta destino excedería su capacidad');
          await tx.account.update({
            where: { id: from.id },
            data: { balance: { decrement: input.amount } },
          });
          await tx.account.update({
            where: { id: to.id },
            data: { balance: { increment: input.amount } },
          });
          const now = new Date();
          const operationNumber = `PLN-${randomUUID().replaceAll('-', '').slice(0, 28).toUpperCase()}`;
          const transfer = await tx.transfer.create({
            data: {
              sourceAccountId: from.id,
              destinationAccountId: to.id,
              userId,
              kind: TransferKind.THIRD_PARTY,
              operationNumber,
              idempotencyKey: `PLIN_${randomUUID()}`,
              requestFingerprint: input.fingerprint,
              amount: input.amount,
              currency: Currency.PEN,
              status: TransactionStatus.COMPLETED,
              description: 'Plineo',
              completedAt: now,
            },
          });
          await tx.transaction.createMany({
            data: [
              {
                accountId: from.id,
                transferId: transfer.id,
                type: TransactionType.TRANSFER,
                direction: TransactionDirection.DEBIT,
                status: TransactionStatus.COMPLETED,
                amount: input.amount,
                currency: Currency.PEN,
                description: 'Plineo enviado',
                reference: operationNumber,
                occurredAt: now,
              },
              {
                accountId: to.id,
                transferId: transfer.id,
                type: TransactionType.TRANSFER,
                direction: TransactionDirection.CREDIT,
                status: TransactionStatus.COMPLETED,
                amount: input.amount,
                currency: Currency.PEN,
                description: 'Plineo recibido',
                reference: operationNumber,
                occurredAt: now,
              },
            ],
          });
          const payment = await tx.plinPayment.create({
            data: {
              userId,
              transferId: transfer.id,
              recipientPhone: input.phoneNumber,
              senderPhone: sender.phoneNumber,
              idempotencyKey: input.idempotencyKey,
              requestFingerprint: input.fingerprint,
              amount: input.amount,
            },
            include: PLIN_PAYMENT_INCLUDE,
          });
          return { payment, replayed: false };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          maxWait: 3000,
          timeout: 8000,
        },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const repeated = await this.findByKey(userId, input.idempotencyKey);
          if (repeated) return this.replay(repeated, input.fingerprint);
        }
        if (
          ['P2028', 'P2034'].includes(error.code) ||
          (error.code === 'P2010' && ['55P03', '40P01'].includes(String(error.meta?.code)))
        )
          throw new ServiceUnavailableException('Operación ocupada; reintenta con la misma clave');
      }
      throw error;
    }
  }

  private replay(payment: PlinPaymentDetails, fingerprint: string) {
    if (payment.requestFingerprint !== fingerprint)
      throw new ConflictException('La clave de idempotencia ya se usó con otros datos');
    return { payment, replayed: true };
  }
}
