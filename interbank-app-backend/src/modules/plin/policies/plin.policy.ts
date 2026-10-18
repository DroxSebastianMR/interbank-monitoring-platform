import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import type { SendPlinDto } from '@/modules/plin/dto/plin.dto';

export class PlinPolicy {
  static amount(value: number): Prisma.Decimal {
    if (!Number.isFinite(value)) throw new BadRequestException('Monto inválido');
    const amount = new Prisma.Decimal(value.toString());
    if (amount.lt(1) || amount.gt(500) || amount.decimalPlaces() > 2)
      throw new BadRequestException(
        'El monto debe estar entre S/1 y S/500, con máximo dos decimales',
      );
    return amount;
  }

  static key(value?: string): string {
    if (!value || !/^[A-Za-z0-9_-]{8,80}$/.test(value))
      throw new BadRequestException('Idempotency-Key inválida');
    return value;
  }

  static fingerprint(dto: SendPlinDto, amount: Prisma.Decimal): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          fromAccountId: dto.fromAccountId.toLowerCase(),
          phoneNumber: dto.phoneNumber,
          amount: amount.toFixed(2),
        }),
      )
      .digest('hex');
  }

  static peruDayStart(now = new Date()): Date {
    const local = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 5));
  }
}
