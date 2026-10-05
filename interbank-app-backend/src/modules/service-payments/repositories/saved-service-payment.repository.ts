import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/common/prisma/prisma.service';
import { ServicePaymentFailureReason } from '@/modules/service-payments/enums/service-payment-failure-reason.enum';
import { ServicePaymentDomainError } from '@/modules/service-payments/exceptions/service-payment-domain.error';
import {
  SAVED_SERVICE_PAYMENT_DETAILS_INCLUDE,
  type CreateSavedServicePaymentInput,
} from '@/modules/service-payments/types/saved-service-payment.types';

@Injectable()
export class SavedServicePaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.savedServicePayment.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: SAVED_SERVICE_PAYMENT_DETAILS_INCLUDE,
    });
  }

  upsert(userId: string, serviceAgreementId: string, input: CreateSavedServicePaymentInput) {
    return this.prisma.savedServicePayment.upsert({
      where: {
        userId_serviceAgreementId_customerReference: {
          userId,
          serviceAgreementId,
          customerReference: input.customerReference,
        },
      },
      update: { alias: input.alias },
      create: {
        userId,
        serviceAgreementId,
        customerReference: input.customerReference,
        alias: input.alias,
      },
      include: SAVED_SERVICE_PAYMENT_DETAILS_INCLUDE,
    });
  }

  async delete(userId: string, savedPaymentId: string): Promise<void> {
    const result = await this.prisma.savedServicePayment.deleteMany({
      where: { id: savedPaymentId, userId },
    });
    if (result.count !== 1) {
      throw new ServicePaymentDomainError(ServicePaymentFailureReason.SAVED_PAYMENT_NOT_FOUND);
    }
  }
}
