import { apiClient } from "@/src/infrastructure/api/client/axios.instance";
import { API_ENDPOINTS } from "@/src/infrastructure/api/endpoints";
import type {
  DebtInquiry,
  PaymentInput,
  ServiceCategory,
  ServicePaymentReceipt,
  ServiceProvider,
  SavedServicePayment,
} from "@/src/domain/payments/payment.types";

const endpoints = API_ENDPOINTS.SERVICE_PAYMENTS;

export const paymentsService = {
  async saved(signal?: AbortSignal) {
    return (
      await apiClient.get<SavedServicePayment[]>(endpoints.SAVED, { signal })
    ).data;
  },
  async save(input: {
    serviceCode: string;
    customerReference: string;
    alias: string;
  }) {
    return (await apiClient.post<SavedServicePayment>(endpoints.SAVED, input))
      .data;
  },
  async categories(signal?: AbortSignal) {
    return (
      await apiClient.get<ServiceCategory[]>(endpoints.CATEGORIES, { signal })
    ).data;
  },
  async providers(search: string, category?: string, signal?: AbortSignal) {
    return (
      await apiClient.get<ServiceProvider[]>(endpoints.PROVIDERS, {
        params: {
          search: search.trim() || undefined,
          category: category || undefined,
          limit: 50,
        },
        signal,
      })
    ).data;
  },
  async inquire(serviceCode: string, customerReference: string) {
    return (
      await apiClient.post<DebtInquiry>(endpoints.DEBT_INQUIRY, {
        serviceCode,
        customerReference,
      })
    ).data;
  },
  async pay(input: PaymentInput, idempotencyKey: string) {
    return (
      await apiClient.post<ServicePaymentReceipt>(endpoints.ROOT, input, {
        headers: { "Idempotency-Key": idempotencyKey },
      })
    ).data;
  },
};
