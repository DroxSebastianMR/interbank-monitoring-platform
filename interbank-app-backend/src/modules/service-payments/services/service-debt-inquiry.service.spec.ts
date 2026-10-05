import { BadRequestException } from '@nestjs/common';

import { ServiceDebtsRepository } from '@/modules/service-payments/repositories/service-debts.repository';
import { ServiceAgreementResolverService } from '@/modules/service-payments/services/service-agreement-resolver.service';
import { ServiceDebtInquiryService } from '@/modules/service-payments/services/service-debt-inquiry.service';
import { ServicePaymentsCacheService } from '@/modules/service-payments/services/service-payments-cache.service';
import { ServiceReferenceValidatorService } from '@/modules/service-payments/services/service-reference-validator.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

describe('ServiceDebtInquiryService', () => {
  const debtsRepository = { findPending: jest.fn() };
  const agreementResolver = { resolve: jest.fn() };
  const simulation = { apply: jest.fn().mockResolvedValue(undefined) };
  const cache = {
    debts: jest.fn().mockResolvedValue(null),
    setDebts: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ServiceDebtInquiryService(
    debtsRepository as unknown as ServiceDebtsRepository,
    agreementResolver as unknown as ServiceAgreementResolverService,
    new ServiceReferenceValidatorService(),
    simulation as unknown as SimulationService,
    cache as unknown as ServicePaymentsCacheService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    cache.debts.mockResolvedValue(null);
  });

  it('validates the company reference before querying debts', async () => {
    agreementResolver.resolve.mockResolvedValue({
      id: '30000000-0000-4000-8000-000000000001',
      code: 'LUZ_DEL_SUR_ELECTRICIDAD',
      referenceLabel: 'Número de suministro',
      referencePattern: '^\\d{9}$',
      referenceMinLength: 9,
      referenceMaxLength: 9,
    });

    await expect(
      service.inquire({
        serviceCode: 'LUZ_DEL_SUR_ELECTRICIDAD',
        customerReference: 'ABC',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(debtsRepository.findPending).not.toHaveBeenCalled();
  });
});
