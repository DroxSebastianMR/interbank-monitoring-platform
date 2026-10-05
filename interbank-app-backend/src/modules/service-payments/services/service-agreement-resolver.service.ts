import { Injectable, NotFoundException } from '@nestjs/common';

import { ServicePaymentFailureReason } from '@/modules/service-payments/enums/service-payment-failure-reason.enum';
import { ServiceCatalogRepository } from '@/modules/service-payments/repositories/service-catalog.repository';

@Injectable()
export class ServiceAgreementResolverService {
  constructor(private readonly catalogRepository: ServiceCatalogRepository) {}

  async resolve(serviceCode: string) {
    const agreement = await this.catalogRepository.findAgreementByCode(
      serviceCode.trim().toUpperCase(),
    );
    if (!agreement) {
      throw new NotFoundException({
        code: ServicePaymentFailureReason.SERVICE_NOT_FOUND,
        message: 'Servicio de pago no encontrado o no disponible',
      });
    }
    return agreement;
  }
}
