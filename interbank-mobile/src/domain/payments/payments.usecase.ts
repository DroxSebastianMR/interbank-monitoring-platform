import { paymentsService } from "@/src/infrastructure/api/payments/services/payments.service";
import type { ServiceAgreement } from "./payment.types";

// Monetary calculations use integer cents; API decimal strings stay unchanged.
export function toCents(value: string): number {
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(value))
    throw new Error("INVALID_PAYMENT_AMOUNT");
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function validateReference(
  service: ServiceAgreement,
  reference: string,
): string {
  const value = reference.trim();
  if (
    value.length < service.referenceMinLength ||
    value.length > service.referenceMaxLength
  ) {
    throw new Error("INVALID_CUSTOMER_REFERENCE");
  }
  if (service.referencePattern) {
    if (!new RegExp(service.referencePattern).test(value))
      throw new Error("INVALID_CUSTOMER_REFERENCE");
  }
  return value;
}

export function validateAmount(
  service: ServiceAgreement,
  amount: string,
): number {
  const cents = toCents(amount);
  if (
    cents <= 0 ||
    (service.minimumAmount !== null &&
      cents < toCents(service.minimumAmount)) ||
    (service.maximumAmount !== null && cents > toCents(service.maximumAmount))
  ) {
    throw new Error("INVALID_PAYMENT_AMOUNT");
  }
  return cents;
}

export const getPaymentCategories = paymentsService.categories;
export const searchPaymentProviders = paymentsService.providers;
export const inquireServiceDebts = paymentsService.inquire;
export const executeServicePayment = paymentsService.pay;
export const getSavedServicePayments = paymentsService.saved;
export const saveServicePayment = paymentsService.save;
