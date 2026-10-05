import { Injectable, NotFoundException } from '@nestjs/common';

import { ServicePaymentMapper } from '@/modules/service-payments/mappers/service-payment.mapper';
import { ServicePaymentQueryRepository } from '@/modules/service-payments/repositories/service-payment-query.repository';

@Injectable()
export class ServicePaymentQueryService {
  constructor(private readonly queryRepository: ServicePaymentQueryRepository) {}

  async history(userId: string, limit: number) {
    const payments = await this.queryRepository.findHistory(userId, limit);
    return payments.map((payment) => ServicePaymentMapper.payment(payment));
  }

  async detail(userId: string, paymentId: string) {
    const payment = await this.queryRepository.findById(userId, paymentId);
    if (!payment) {
      throw new NotFoundException({
        code: 'SERVICE_PAYMENT_NOT_FOUND',
        message: 'Pago de servicio no encontrado',
      });
    }
    return ServicePaymentMapper.payment(payment);
  }
}
