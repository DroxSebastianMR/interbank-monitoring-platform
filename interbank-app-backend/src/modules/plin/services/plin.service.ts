import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import type { PlinNetwork, SavePlinFavoriteDto, SendPlinDto } from '@/modules/plin/dto/plin.dto';
import { PlinPolicy } from '@/modules/plin/policies/plin.policy';
import {
  PlinRepository,
  type PlinPaymentDetails,
} from '@/modules/plin/repositories/plin.repository';

@Injectable()
export class PlinService {
  private readonly logger = new Logger(PlinService.name);
  constructor(
    private readonly repository: PlinRepository,
    private readonly homeCache: HomeCacheService,
  ) {}

  networks() {
    return [
      { network: 'PLIN', logoKey: 'PLIN', available: true, mode: 'INTERNAL' },
      { network: 'YAPE', logoKey: 'YAPE', available: false, mode: 'PARTNER_REQUIRED' },
    ];
  }

  async favorites(userId: string) {
    return (await this.repository.favorites(userId)).map((item) => ({
      phoneNumber: item.phoneNumber,
      alias: item.alias,
      preferredNetwork: item.preferredNetwork,
    }));
  }

  async saveFavorite(userId: string, dto: SavePlinFavoriteDto) {
    const enrollment = await this.repository.enrollment(userId);
    if (enrollment?.phoneNumber === dto.phoneNumber)
      throw new BadRequestException('No puedes guardarte a ti mismo');
    const existing = await this.repository.favorite(userId, dto.phoneNumber);
    if (!existing && (await this.repository.favorites(userId)).length >= 50)
      throw new BadRequestException('Máximo 50 contactos favoritos');
    const item = await this.repository.saveFavorite(
      userId,
      dto.phoneNumber,
      dto.alias?.trim() || null,
      dto.network ?? 'PLIN',
    );
    return {
      phoneNumber: item.phoneNumber,
      alias: item.alias,
      preferredNetwork: item.preferredNetwork,
    };
  }

  async removeFavorite(userId: string, phoneNumber: string) {
    if (!/^9\d{8}$/.test(phoneNumber)) throw new BadRequestException('Celular inválido');
    const result = await this.repository.removeFavorite(userId, phoneNumber);
    if (result.count === 0) throw new NotFoundException('Contacto favorito no encontrado');
  }

  async recent(userId: string) {
    const payments = await this.repository.list(userId);
    const seen = new Set<string>();
    return payments
      .flatMap((payment) => {
        const phoneNumber =
          payment.userId === userId ? payment.recipientPhone : payment.senderPhone;
        if (!phoneNumber || seen.has(phoneNumber)) return [];
        seen.add(phoneNumber);
        return [
          { phoneNumber, network: 'PLIN' as const, lastPaymentAt: payment.createdAt.toISOString() },
        ];
      })
      .slice(0, 20);
  }

  async enrollment(userId: string) {
    const item = await this.repository.enrollment(userId);
    return item
      ? {
          phoneNumber: item.phoneNumber,
          accountId: item.accountId,
          isActive: item.isActive,
          simulated: true,
        }
      : null;
  }

  async enroll(userId: string, accountId: string) {
    try {
      const item = await this.repository.enroll(userId, accountId.toLowerCase());
      return {
        phoneNumber: item.phoneNumber,
        accountId: item.accountId,
        isActive: item.isActive,
        simulated: true,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('El celular ya está afiliado');
      throw error;
    }
  }

  async disable(userId: string) {
    const result = await this.repository.disable(userId);
    if (result.count === 0) throw new NotFoundException('No hay una afiliación activa');
  }

  async sources(userId: string) {
    return (await this.repository.sources(userId)).map((account) => ({
      id: account.id,
      displayName: account.displayName,
      maskedAccountNumber: `****${account.accountNumber.slice(-4)}`,
      availableBalance: account.balance.toFixed(2),
      currency: 'PEN' as const,
    }));
  }

  async resolve(userId: string, phoneNumber: string, network: PlinNetwork = 'PLIN') {
    if (network === 'YAPE') {
      return {
        phoneNumber,
        displayName: null,
        network,
        verified: false,
        available: false,
        logoKey: network,
      };
    }
    const recipient = await this.repository.recipient(phoneNumber);
    if (!recipient || recipient.userId === userId)
      throw new NotFoundException('Destinatario no disponible en la red interna');
    const initial = recipient.user.lastName?.charAt(0);
    return {
      phoneNumber,
      displayName:
        `${recipient.user.firstName ?? 'Cliente'} ${initial ? `${initial}.` : ''}`.trim(),
      network: 'PLIN' as const,
      verified: true,
      available: true,
      logoKey: 'PLIN' as const,
    };
  }

  async send(userId: string, dto: SendPlinDto, key?: string) {
    if (dto.network === 'YAPE')
      throw new ServiceUnavailableException(
        'El envío a Yape requiere conexión con el operador interoperable; no se ha cargado dinero',
      );
    const amount = PlinPolicy.amount(dto.amount);
    const idempotencyKey = PlinPolicy.key(key);
    const result = await this.repository.send(userId, {
      fromAccountId: dto.fromAccountId.toLowerCase(),
      phoneNumber: dto.phoneNumber,
      amount,
      idempotencyKey,
      fingerprint: PlinPolicy.fingerprint(dto, amount),
    });
    const ids = [userId, result.payment.transfer.destinationAccount.userId];
    const invalidations = await Promise.allSettled(ids.map((id) => this.homeCache.invalidate(id)));
    if (invalidations.some((item) => item.status === 'rejected'))
      this.logger.warn('Plineo confirmado; falló la invalidación de caché');
    return this.map(result.payment, userId, result.replayed);
  }

  async list(userId: string) {
    return (await this.repository.list(userId)).map((item) => this.map(item, userId));
  }

  async detail(userId: string, id: string) {
    const payment = await this.repository.detail(userId, id);
    if (!payment) throw new NotFoundException('Plineo no encontrado');
    return this.map(payment, userId);
  }

  private map(payment: PlinPaymentDetails, userId: string, replayed = false) {
    return {
      id: payment.id,
      operationNumber: payment.transfer.operationNumber,
      amount: payment.amount.toFixed(2),
      currency: 'PEN' as const,
      recipientPhone: payment.recipientPhone,
      senderPhone: payment.senderPhone,
      network: 'PLIN' as const,
      createdAt: payment.createdAt.toISOString(),
      replayed,
      simulated: true,
      direction: payment.userId === userId ? ('SENT' as const) : ('RECEIVED' as const),
    };
  }
}
