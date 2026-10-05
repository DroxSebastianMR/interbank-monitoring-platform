import { Injectable } from '@nestjs/common';

import type { CreateSavedServicePaymentDto } from '@/modules/service-payments/dto/create-saved-service-payment.dto';
import { ServicePaymentExceptionFactory } from '@/modules/service-payments/exceptions/service-payment-exception.factory';
import { ServicePaymentMapper } from '@/modules/service-payments/mappers/service-payment.mapper';
import { SavedServicePaymentRepository } from '@/modules/service-payments/repositories/saved-service-payment.repository';
import { ServiceAgreementResolverService } from '@/modules/service-payments/services/service-agreement-resolver.service';
import { ServiceReferenceValidatorService } from '@/modules/service-payments/services/service-reference-validator.service';

@Injectable()
export class SavedServicePaymentService {
  constructor(
    private readonly savedRepository: SavedServicePaymentRepository,
    private readonly agreementResolver: ServiceAgreementResolverService,
    private readonly referenceValidator: ServiceReferenceValidatorService,
  ) {}

  async list(userId: string) {
    const payments = await this.savedRepository.findAll(userId);
    return payments.map((payment) => ServicePaymentMapper.savedPayment(payment));
  }

  async save(userId: string, input: CreateSavedServicePaymentDto) {
    const agreement = await this.agreementResolver.resolve(input.serviceCode);
    this.referenceValidator.validate(agreement, input.customerReference);
    try {
      const saved = await this.savedRepository.upsert(userId, agreement.id, {
        customerReference: input.customerReference,
        alias: input.alias.trim(),
      });
      return ServicePaymentMapper.savedPayment(saved);
    } catch (error) {
      ServicePaymentExceptionFactory.rethrow(error);
    }
  }

  async delete(userId: string, savedPaymentId: string): Promise<void> {
    try {
      await this.savedRepository.delete(userId, savedPaymentId);
    } catch (error) {
      ServicePaymentExceptionFactory.rethrow(error);
    }
  }
}
