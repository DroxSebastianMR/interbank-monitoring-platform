import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class ServiceDebtsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPending(serviceAgreementId: string, customerReference: string) {
    return this.prisma.serviceDebt.findMany({
      where: { serviceAgreementId, customerReference, status: 'PENDING' },
      orderBy: [{ dueDate: 'asc' }, { issuedAt: 'asc' }],
    });
  }
}
