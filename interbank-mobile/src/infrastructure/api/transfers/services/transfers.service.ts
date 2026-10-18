import { apiClient } from "@/src/infrastructure/api/client/axios.instance";
import { API_ENDPOINTS } from "@/src/infrastructure/api/endpoints";
import type {
  TransferBeneficiary,
  TransferSource,
} from "@/src/domain/transfers/transfer.types";

export const transfersService = {
  async sources(signal?: AbortSignal): Promise<TransferSource[]> {
    return (
      await apiClient.get<TransferSource[]>(API_ENDPOINTS.TRANSFERS.SOURCES, {
        signal,
      })
    ).data;
  },
  async resolve(
    accountNumber: string,
    signal?: AbortSignal,
  ): Promise<TransferBeneficiary> {
    return (
      await apiClient.post<TransferBeneficiary>(
        API_ENDPOINTS.TRANSFERS.RESOLVE,
        { accountNumber },
        { signal },
      )
    ).data;
  },
};
