import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/common/prisma/prisma.service';
import type { ServiceProviderFilters } from '@/modules/service-payments/types/service-catalog.types';

@Injectable()
export class ServiceCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCategories() {
    return this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        code: true,
        name: true,
        description: true,
        iconKey: true,
        _count: { select: { providers: { where: { status: 'ACTIVE' } } } },
      },
    });
  }

  findProviders(filters: ServiceProviderFilters) {
    const search = filters.search?.trim();
    return this.prisma.serviceProvider.findMany({
      where: {
        status: 'ACTIVE',
        category: {
          isActive: true,
          ...(filters.categoryCode ? { code: filters.categoryCode } : {}),
        },
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: 'insensitive' as const } },
                { name: { contains: search, mode: 'insensitive' as const } },
                { shortName: { contains: search, mode: 'insensitive' as const } },
                { searchAliases: { has: search.toUpperCase() } },
              ],
            }
          : {}),
      },
      take: filters.limit,
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        code: true,
        name: true,
        shortName: true,
        legalName: true,
        logoUrl: true,
        category: { select: { code: true, name: true, iconKey: true } },
        agreements: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            code: true,
            name: true,
            description: true,
            referenceLabel: true,
            referenceType: true,
            referencePattern: true,
            referenceMinLength: true,
            referenceMaxLength: true,
            supportsDebtInquiry: true,
            supportsPartialPayment: true,
            currency: true,
            commissionAmount: true,
            minimumAmount: true,
            maximumAmount: true,
          },
        },
      },
    });
  }

  findAgreementByCode(serviceCode: string) {
    return this.prisma.serviceAgreement.findFirst({
      where: { code: serviceCode, isActive: true, provider: { status: 'ACTIVE' } },
      include: { provider: { include: { category: true } } },
    });
  }
}
