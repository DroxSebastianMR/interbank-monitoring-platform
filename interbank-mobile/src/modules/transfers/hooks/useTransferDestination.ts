import { useEffect, useRef, useState } from "react";
import {
  TransferBank,
  TransferMode,
} from "@/src/domain/transfers/transfer.types";
import type {
  TransferBeneficiary,
  TransferSource,
} from "@/src/domain/transfers/transfer.types";
import {
  getTransferSources,
  isValidTransferAccount,
  resolveTransferBeneficiary,
} from "@/src/domain/transfers/transfers.usecase";
import { transferErrorMessage } from "@/src/modules/transfers/utils/transfer-error.mapper";

export function useTransferDestination(mode: TransferMode) {
  const [bank, setBankState] = useState(TransferBank.INTERBANK);
  const [number, setNumber] = useState("");
  const [accounts, setAccounts] = useState<TransferSource[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(
    mode === TransferMode.OWN,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState<TransferBeneficiary | null>(null);
  const [revision, setRevision] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (mode !== TransferMode.OWN) return;
    const controller = new AbortController();
    setLoadingAccounts(true);
    setError("");
    void getTransferSources(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setAccounts(result);
        setSourceId(result[0]?.id ?? "");
        setDestinationId("");
      })
      .catch((failure: unknown) => {
        if (!controller.signal.aborted) setError(transferErrorMessage(failure));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingAccounts(false);
      });
    return () => controller.abort();
  }, [mode, revision]);

  const source = accounts.find((item) => item.id === sourceId);
  const destinations = accounts.filter(
    (item) => item.id !== sourceId && item.currency === source?.currency,
  );
  const destination = destinations.find((item) => item.id === destinationId);
  const valid =
    mode === TransferMode.OWN
      ? !!source && !!destination
      : bank === TransferBank.INTERBANK && isValidTransferAccount(number);

  const cancelLookup = () => {
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setVerified(null);
    setSheetVisible(false);
    setError("");
  };
  const changeNumber = (value: string) => {
    cancelLookup();
    setNumber(value.replace(/[^\d\s-]/g, ""));
  };
  const changeBank = (value: TransferBank) => {
    cancelLookup();
    setBankState(value);
    setNumber("");
  };
  const changeSource = (value: string) => {
    setSourceId(value);
    setDestinationId("");
    setVerified(null);
    setError("");
  };

  const next = async () => {
    if (!valid || request.current) return;
    if (mode === TransferMode.OWN) {
      if (!destination) return;
      setVerified({
        ...destination,
        beneficiaryName: "Cuenta propia",
        kind: TransferMode.OWN,
      });
      setSheetVisible(true);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError("");
    try {
      const result = await resolveTransferBeneficiary(
        number,
        controller.signal,
      );
      if (!controller.signal.aborted && mounted.current) {
        setVerified(result);
        setSheetVisible(true);
      }
    } catch (failure) {
      if (!controller.signal.aborted && mounted.current)
        setError(transferErrorMessage(failure));
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (mounted.current) setBusy(false);
      }
    }
  };

  return {
    bank,
    number,
    accounts,
    sourceId,
    destinationId,
    source,
    destination,
    destinations,
    loadingAccounts,
    busy,
    error,
    verified,
    sheetVisible,
    valid,
    changeBank,
    changeNumber,
    changeSource,
    setDestinationId,
    next,
    closeSheet: () => setSheetVisible(false),
    reload: () => setRevision((value) => value + 1),
  };
}
