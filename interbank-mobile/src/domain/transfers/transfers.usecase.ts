import { transfersService } from "@/src/infrastructure/api/transfers/services/transfers.service";

export function normalizeTransferAccount(value: string): string {
  return value.replace(/[\s-]/g, "");
}

export function isValidTransferAccount(value: string): boolean {
  // The simulator accepts 10–20 digits, independently of real-bank account formats.
  return /^\d{10,20}$/.test(normalizeTransferAccount(value));
}

export function resolveTransferBeneficiary(
  value: string,
  signal?: AbortSignal,
) {
  if (!isValidTransferAccount(value)) throw new Error("INVALID_ACCOUNT_NUMBER");
  return transfersService.resolve(normalizeTransferAccount(value), signal);
}

export const getTransferSources = transfersService.sources;
