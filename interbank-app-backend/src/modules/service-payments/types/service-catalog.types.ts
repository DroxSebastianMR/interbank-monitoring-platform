import type { Currency, PaymentReferenceType } from '@prisma/client';

export interface ServiceProviderFilters {
  categoryCode?: string;
  search?: string;
  limit: number;
}

export interface ServiceCategoryResponse {
  code: string;
  name: string;
  description: string | null;
  iconKey: string;
  providerCount: number;
}

export interface ServiceAgreementCatalogResponse {
  code: string;
  name: string;
  description: string | null;
  referenceLabel: string;
  referenceType: PaymentReferenceType;
  referencePattern: string | null;
  referenceMinLength: number;
  referenceMaxLength: number;
  supportsDebtInquiry: boolean;
  supportsPartialPayment: boolean;
  currency: Currency;
  commissionAmount: string;
  minimumAmount: string | null;
  maximumAmount: string | null;
}

export interface ServiceProviderCatalogResponse {
  code: string;
  name: string;
  shortName: string;
  legalName: string | null;
  logoUrl: string | null;
  category: { code: string; name: string; iconKey: string };
  agreements: ServiceAgreementCatalogResponse[];
}
