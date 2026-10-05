import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/common/prisma/prisma.service';
import { SERVICE_PAYMENT_DETAILS_INCLUDE } from '@/modules/service-payments/types/service-payment.types';

@Injectable()
export class ServicePaymentQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findHistory(userId: string, limit: number) {
    return this.prisma.servicePayment.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: SERVICE_PAYMENT_DETAILS_INCLUDE,
    });
  }

  findById(userId: string, paymentId: string) {
    return this.prisma.servicePayment.findFirst({
      where: { id: paymentId, userId },
      include: SERVICE_PAYMENT_DETAILS_INCLUDE,
    });
  }
}
