import type { Currency } from "@/src/infrastructure/api/home/services/home.types";

export enum TransferMode {
  OWN = "OWN_ACCOUNTS",
  OTHER = "THIRD_PARTY",
}

export enum TransferBank {
  INTERBANK = "INTERBANK",
  DOMESTIC = "DOMESTIC",
  INTERNATIONAL = "INTERNATIONAL",
}

export interface TransferAccount {
  id: string;
  displayName: string;
  maskedAccountNumber: string;
  currency: Currency;
}

export interface TransferSource extends TransferAccount {
  availableBalance: string;
  accountTypeName: string;
}

export interface TransferBeneficiary extends TransferAccount {
  beneficiaryName: string;
  kind: TransferMode;
}
