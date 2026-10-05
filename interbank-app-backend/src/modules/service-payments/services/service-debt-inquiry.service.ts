import { Injectable } from '@nestjs/common';

import type { InquireServiceDebtsDto } from '@/modules/service-payments/dto/inquire-service-debts.dto';
import { ServicePaymentMapper } from '@/modules/service-payments/mappers/service-payment.mapper';
import { ServiceDebtsRepository } from '@/modules/service-payments/repositories/service-debts.repository';
import { ServiceAgreementResolverService } from '@/modules/service-payments/services/service-agreement-resolver.service';
import { ServicePaymentsCacheService } from '@/modules/service-payments/services/service-payments-cache.service';
import { ServiceReferenceValidatorService } from '@/modules/service-payments/services/service-reference-validator.service';
import type { ServiceDebtInquiryResponse } from '@/modules/service-payments/types/service-debt.types';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

@Injectable()
export class ServiceDebtInquiryService {
  constructor(
    private readonly debtsRepository: ServiceDebtsRepository,
    private readonly agreementResolver: ServiceAgreementResolverService,
    private readonly referenceValidator: ServiceReferenceValidatorService,
    private readonly simulation: SimulationService,
    private readonly cache: ServicePaymentsCacheService,
  ) {}

  async inquire(input: InquireServiceDebtsDto): Promise<ServiceDebtInquiryResponse> {
    await this.simulation.apply('service-payments');
    const serviceCode = input.serviceCode.trim().toUpperCase();
    const customerReference = input.customerReference.trim();
    const cached = await this.cache.debts<ServiceDebtInquiryResponse>(
      serviceCode,
      customerReference,
    );
    if (cached) return cached;

    const agreement = await this.agreementResolver.resolve(serviceCode);
    this.referenceValidator.validate(agreement, customerReference);
    const debts = agreement.supportsDebtInquiry
      ? await this.debtsRepository.findPending(agreement.id, customerReference)
      : [];
    const response = {
      provider: {
        code: agreement.provider.code,
        name: agreement.provider.name,
        shortName: agreement.provider.shortName,
        logoUrl: agreement.provider.logoUrl,
        category: agreement.provider.category.code,
      },
      service: {
        code: agreement.code,
        name: agreement.name,
        referenceLabel: agreement.referenceLabel,
        supportsDebtInquiry: agreement.supportsDebtInquiry,
        supportsPartialPayment: agreement.supportsPartialPayment,
        currency: agreement.currency,
      },
      customerReference,
      debts: debts.map((debt) => ServicePaymentMapper.debt(debt)),
    };
    await this.cache.setDebts(serviceCode, customerReference, response);
    return response;
  }
}
