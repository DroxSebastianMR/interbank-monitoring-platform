import { ServicePaymentFailureReason } from '@/modules/service-payments/enums/service-payment-failure-reason.enum';

export class ServicePaymentDomainError extends Error {
  constructor(readonly reason: ServicePaymentFailureReason) {
    super(reason);
    this.name = ServicePaymentDomainError.name;
  }
}
