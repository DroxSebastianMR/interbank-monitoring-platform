import type { Currency } from "@/src/infrastructure/api/home/services/home.types";

export enum PaymentStep {
  CATALOG = "CATALOG",
  REFERENCE = "REFERENCE",
  REVIEW = "REVIEW",
  RECEIPT = "RECEIPT",
}

export interface ServiceCategory {
  code: string;
  name: string;
  iconKey: string;
  providerCount: number;
}

export interface ServiceAgreement {
  code: string;
  name: string;
  referenceLabel: string;
  referenceType: string;
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

export interface ServiceProvider {
  code: string;
  name: string;
  shortName: string;
  logoUrl?: string | null;
  category: { code: string; name: string; iconKey: string };
  agreements: ServiceAgreement[];
}

export interface SavedServicePayment {
  id: string;
  alias: string;
  customerReference: string;
  provider: {
    code: string;
    name: string;
    shortName: string;
    logoUrl: string | null;
    category: string;
  };
  service: { code: string; name: string; referenceLabel: string };
}

export interface ServiceDebt {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: string;
  currency: Currency;
  dueDate: string;
  status: string;
}

export interface DebtInquiry {
  customerReference: string;
  debts: ServiceDebt[];
}

export interface PaymentInput {
  accountId: string;
  serviceCode: string;
  customerReference: string;
  debtId?: string;
  amount?: number;
}

export interface ServicePaymentReceipt {
  id: string;
  operationNumber: string;
  status: string;
  account: { id: string; displayName: string; maskedNumber: string };
  provider: { code: string; name: string; shortName: string };
  service: { code: string; name: string };
  customerReference: string;
  amount: string;
  commissionAmount: string;
  totalAmount: string;
  currency: Currency;
  paidAt: string | null;
}
