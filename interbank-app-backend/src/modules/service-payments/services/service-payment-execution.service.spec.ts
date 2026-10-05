import { BadRequestException, NotFoundException } from '@nestjs/common';

import { HomeCacheService } from '@/modules/home/services/home-cache.service';
import { ServicePaymentCommandRepository } from '@/modules/service-payments/repositories/service-payment-command.repository';
import { ServiceAgreementResolverService } from '@/modules/service-payments/services/service-agreement-resolver.service';
import { ServicePaymentExecutionService } from '@/modules/service-payments/services/service-payment-execution.service';
import { ServicePaymentsCacheService } from '@/modules/service-payments/services/service-payments-cache.service';
import { ServiceReferenceValidatorService } from '@/modules/service-payments/services/service-reference-validator.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

describe('ServicePaymentExecutionService', () => {
  const commandRepository = { execute: jest.fn() };
  const agreementResolver = { resolve: jest.fn() };
  const simulation = { apply: jest.fn().mockResolvedValue(undefined) };
  const homeCache = { invalidate: jest.fn().mockResolvedValue(undefined) };
  const cache = {
    idempotentPayment: jest.fn().mockResolvedValue(null),
    setIdempotentPayment: jest.fn().mockResolvedValue(undefined),
    invalidateDebts: jest.fn().mockResolvedValue(undefined),
  };
  const service = new ServicePaymentExecutionService(
    commandRepository as unknown as ServicePaymentCommandRepository,
    agreementResolver as unknown as ServiceAgreementResolverService,
    new ServiceReferenceValidatorService(),
    simulation as unknown as SimulationService,
    homeCache as unknown as HomeCacheService,
    cache as unknown as ServicePaymentsCacheService,
  );
  const request = {
    accountId: '00000000-0000-4000-8000-000000000001',
    serviceCode: 'UNKNOWN',
    customerReference: '123456789',
    debtId: '40000000-0000-4000-8000-000000000001',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cache.idempotentPayment.mockResolvedValue(null);
  });

  it('rejects an unknown service before creating a payment', async () => {
    agreementResolver.resolve.mockRejectedValue(
      new NotFoundException({
        code: 'SERVICE_NOT_FOUND',
        message: 'Servicio de pago no encontrado o no disponible',
      }),
    );

    await expect(
      service.execute('user-id', request, '04fa19dc-4349-44a6-8c44-c85b4f74c41e'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(commandRepository.execute).not.toHaveBeenCalled();
  });

  it('requires an idempotency key before debiting an account', async () => {
    await expect(service.execute('user-id', request)).rejects.toBeInstanceOf(BadRequestException);
    expect(commandRepository.execute).not.toHaveBeenCalled();
  });
});
