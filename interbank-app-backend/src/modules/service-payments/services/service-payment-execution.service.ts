import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';

import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import {
  IDEMPOTENCY_KEY_MAX_LENGTH,
  IDEMPOTENCY_KEY_MIN_LENGTH,
} from '@/modules/service-payments/constants/service-payment.constants';
import type { CreateServicePaymentDto } from '@/modules/service-payments/dto/create-service-payment.dto';
import { ServicePaymentFailureReason } from '@/modules/service-payments/enums/service-payment-failure-reason.enum';
import { ServicePaymentExceptionFactory } from '@/modules/service-payments/exceptions/service-payment-exception.factory';
import { ServicePaymentMapper } from '@/modules/service-payments/mappers/service-payment.mapper';
import { ServicePaymentCommandRepository } from '@/modules/service-payments/repositories/service-payment-command.repository';
import { ServiceAgreementResolverService } from '@/modules/service-payments/services/service-agreement-resolver.service';
import { ServicePaymentsCacheService } from '@/modules/service-payments/services/service-payments-cache.service';
import { ServiceReferenceValidatorService } from '@/modules/service-payments/services/service-reference-validator.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

type PaymentResponse = ReturnType<typeof ServicePaymentMapper.payment>;

interface CachedPaymentResponse {
  fingerprint: string;
  response: PaymentResponse;
}

@Injectable()
export class ServicePaymentExecutionService {
  constructor(
    private readonly commandRepository: ServicePaymentCommandRepository,
    private readonly agreementResolver: ServiceAgreementResolverService,
    private readonly referenceValidator: ServiceReferenceValidatorService,
    private readonly simulation: SimulationService,
    private readonly homeCache: HomeCacheService,
    private readonly cache: ServicePaymentsCacheService,
  ) {}

  async execute(
    userId: string,
    input: CreateServicePaymentDto,
    idempotencyKey?: string,
  ): Promise<PaymentResponse> {
    await this.simulation.apply('service-payments');
    this.validateIdempotencyKey(idempotencyKey);
    const requestFingerprint = this.createFingerprint(input);
    const cached = await this.cache.idempotentPayment<CachedPaymentResponse>(
      userId,
      idempotencyKey,
    );
    if (cached) return this.resolveCachedPayment(cached, requestFingerprint);

    const agreement = await this.agreementResolver.resolve(input.serviceCode);
    this.referenceValidator.validate(agreement, input.customerReference);
    try {
      const result = await this.commandRepository.execute(userId, {
        accountId: input.accountId,
        serviceCode: agreement.code,
        customerReference: input.customerReference,
        ...(input.debtId ? { debtId: input.debtId } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        idempotencyKey,
        requestFingerprint,
        operationNumber: this.createOperationNumber(),
      });
      await this.homeCache.invalidate(userId);
      await this.cache.invalidateDebts(agreement.code, input.customerReference.trim());
      const response = ServicePaymentMapper.payment(result.payment, result.replayed);
      await this.cache.setIdempotentPayment(userId, idempotencyKey, {
        fingerprint: requestFingerprint,
        response,
      });
      return response;
    } catch (error) {
      ServicePaymentExceptionFactory.rethrow(error);
    }
  }

  private resolveCachedPayment(
    cached: CachedPaymentResponse,
    requestFingerprint: string,
  ): PaymentResponse {
    if (cached.fingerprint !== requestFingerprint) {
      throw new ConflictException({
        code: ServicePaymentFailureReason.IDEMPOTENCY_CONFLICT,
        message: 'La clave de idempotencia ya fue usada con otros datos',
      });
    }
    return { ...cached.response, replayed: true };
  }

  private validateIdempotencyKey(
    idempotencyKey: string | undefined,
  ): asserts idempotencyKey is string {
    const length = idempotencyKey?.trim().length ?? 0;
    if (
      !idempotencyKey ||
      length < IDEMPOTENCY_KEY_MIN_LENGTH ||
      length > IDEMPOTENCY_KEY_MAX_LENGTH
    ) {
      throw new BadRequestException({
        code: 'INVALID_IDEMPOTENCY_KEY',
        message: `El encabezado Idempotency-Key debe tener entre ${IDEMPOTENCY_KEY_MIN_LENGTH} y ${IDEMPOTENCY_KEY_MAX_LENGTH} caracteres`,
      });
    }
  }

  private createFingerprint(input: CreateServicePaymentDto): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          accountId: input.accountId,
          serviceCode: input.serviceCode.trim().toUpperCase(),
          customerReference: input.customerReference.trim(),
          debtId: input.debtId ?? null,
          amount: input.amount ?? null,
        }),
      )
      .digest('hex');
  }

  private createOperationNumber(): string {
    const day = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    return `PSV-${day}-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  }
}
