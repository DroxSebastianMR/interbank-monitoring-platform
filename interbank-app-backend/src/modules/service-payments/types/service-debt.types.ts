import type { Currency, ServiceDebtStatus } from '@prisma/client';

export interface ServiceDebtResponse {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: string;
  minimumPaymentAmount: string | null;
  currency: Currency;
  issuedAt: string;
  dueDate: string;
  status: ServiceDebtStatus;
}

export interface ServiceDebtInquiryResponse {
  provider: {
    code: string;
    name: string;
    shortName: string;
    logoUrl: string | null;
    category: string;
  };
  service: {
    code: string;
    name: string;
    referenceLabel: string;
    supportsDebtInquiry: boolean;
    supportsPartialPayment: boolean;
    currency: Currency;
  };
  customerReference: string;
  debts: ServiceDebtResponse[];
}
