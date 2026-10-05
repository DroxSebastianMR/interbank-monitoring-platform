import { Injectable } from '@nestjs/common';

import type { ListServiceProvidersQueryDto } from '@/modules/service-payments/dto/list-service-providers-query.dto';
import { ServiceCatalogRepository } from '@/modules/service-payments/repositories/service-catalog.repository';
import { ServicePaymentsCacheService } from '@/modules/service-payments/services/service-payments-cache.service';
import type {
  ServiceCategoryResponse,
  ServiceProviderCatalogResponse,
} from '@/modules/service-payments/types/service-catalog.types';

@Injectable()
export class ServiceCatalogService {
  constructor(
    private readonly catalogRepository: ServiceCatalogRepository,
    private readonly cache: ServicePaymentsCacheService,
  ) {}

  async categories(): Promise<ServiceCategoryResponse[]> {
    const cached = await this.cache.categories<ServiceCategoryResponse[]>();
    if (cached) return cached;

    const categories = await this.catalogRepository.findCategories();
    const response = categories.map(({ _count, ...category }) => ({
      ...category,
      providerCount: _count.providers,
    }));
    await this.cache.setCategories(response);
    return response;
  }

  async providers(query: ListServiceProvidersQueryDto): Promise<ServiceProviderCatalogResponse[]> {
    const category = query.category?.trim().toUpperCase();
    const search = query.search?.trim();
    const cached = await this.cache.providers<ServiceProviderCatalogResponse[]>(
      category,
      search,
      query.limit,
    );
    if (cached) return cached;

    const providers = await this.catalogRepository.findProviders({
      limit: query.limit,
      ...(category ? { categoryCode: category } : {}),
      ...(search ? { search } : {}),
    });
    const response = providers.map((provider) => ({
      ...provider,
      agreements: provider.agreements.map((agreement) => ({
        ...agreement,
        commissionAmount: agreement.commissionAmount.toFixed(2),
        minimumAmount: agreement.minimumAmount?.toFixed(2) ?? null,
        maximumAmount: agreement.maximumAmount?.toFixed(2) ?? null,
      })),
    }));
    await this.cache.setProviders(category, search, query.limit, response);
    return response;
  }
}
