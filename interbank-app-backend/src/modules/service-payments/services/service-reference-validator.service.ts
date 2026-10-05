import { BadRequestException, Injectable } from '@nestjs/common';

import { ServicePaymentFailureReason } from '@/modules/service-payments/enums/service-payment-failure-reason.enum';

interface ReferenceRules {
  referenceMinLength: number;
  referenceMaxLength: number;
  referencePattern: string | null;
  referenceLabel: string;
}

@Injectable()
export class ServiceReferenceValidatorService {
  validate(rules: ReferenceRules, customerReference: string): void {
    const reference = customerReference.trim();
    const validLength =
      reference.length >= rules.referenceMinLength && reference.length <= rules.referenceMaxLength;
    const validPattern = rules.referencePattern
      ? new RegExp(rules.referencePattern).test(reference)
      : true;

    if (!validLength || !validPattern) {
      throw new BadRequestException({
        code: ServicePaymentFailureReason.INVALID_CUSTOMER_REFERENCE,
        message: `${rules.referenceLabel} no tiene un formato válido`,
      });
    }
  }
}
