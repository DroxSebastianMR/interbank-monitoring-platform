import { useCallback, useEffect, useRef, useState } from "react";
import { getHomeSummary } from "@/src/domain/home/home.usecase";
import { PaymentStep } from "@/src/domain/payments/payment.types";
import type {
  PaymentInput,
  ServiceAgreement,
  ServiceCategory,
  ServiceDebt,
  ServicePaymentReceipt,
  ServiceProvider,
  SavedServicePayment,
} from "@/src/domain/payments/payment.types";
import {
  executeServicePayment,
  getPaymentCategories,
  inquireServiceDebts,
  searchPaymentProviders,
  toCents,
  validateAmount,
  validateReference,
} from "@/src/domain/payments/payments.usecase";
import type { HomeAccount } from "@/src/infrastructure/api/home/services/home.types";
import { paymentErrorMessage } from "@/src/modules/payments/utils/payment-format";

export function useServicePayments() {
  const [step, setStep] = useState(PaymentStep.CATALOG);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [revision, setRevision] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [service, setService] = useState<ServiceAgreement | null>(null);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [debts, setDebts] = useState<ServiceDebt[] | null>(null);
  const [debt, setDebt] = useState<ServiceDebt | null>(null);
  const [accounts, setAccounts] = useState<HomeAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const [receipt, setReceipt] = useState<ServicePaymentReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const active = useRef(true);
  const operation = useRef(false);
  const attempt = useRef<{ input: PaymentInput; key: string } | null>(null);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void getPaymentCategories(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCategories(result);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError("");
    const timer = setTimeout(() => {
      void searchPaymentProviders(query, category, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) setProviders(result);
        })
        .catch((failure: unknown) => {
          if (!controller.signal.aborted) {
            setProviders([]);
            setCatalogError(paymentErrorMessage(failure));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setCatalogLoading(false);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, category, revision]);

  const selectProvider = (value: ServiceProvider) => {
    setProvider(value);
    setService(value.agreements[0] ?? null);
    setReference("");
    setAmount("");
    setDebts(null);
    setDebt(null);
    setError("");
    setStep(PaymentStep.REFERENCE);
  };
  const changeService = (value: ServiceAgreement) => {
    setService(value);
    setReference("");
    setAmount("");
    setDebts(null);
    setDebt(null);
    setError("");
  };
  const changeReference = (value: string) => {
    setReference(value);
    setDebts(null);
    setDebt(null);
    setError("");
  };

  const run = async (task: () => Promise<void>) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (failure) {
      if (active.current) setError(paymentErrorMessage(failure));
    } finally {
      operation.current = false;
      if (active.current) setBusy(false);
    }
  };

  const inquire = () =>
    run(async () => {
      if (!service) return;
      const result = await inquireServiceDebts(
        service.code,
        validateReference(service, reference),
      );
      if (!active.current) return;
      setDebts(result.debts);
      setDebt(null);
    });

  const openSaved = (saved: SavedServicePayment) =>
    run(async () => {
      const matches = await searchPaymentProviders(
        saved.provider.shortName || saved.provider.name,
      );
      const found = matches.find((item) => item.code === saved.provider.code);
      const agreement = found?.agreements.find(
        (item) => item.code === saved.service.code,
      );
      if (!found || !agreement) throw new Error("SERVICE_UNAVAILABLE");
      if (!active.current) return;
      selectProvider(found);
      setService(agreement);
      setReference(saved.customerReference);
    });

  const review = () =>
    run(async () => {
      if (!service) return;
      validateReference(service, reference);
      if (service.supportsDebtInquiry && !debt)
        throw new Error("DEBT_NOT_FOUND");
      validateAmount(service, debt?.amount ?? amount.replace(",", "."));
      const summary = await getHomeSummary();
      if (!active.current) return;
      const eligible = summary.accounts.filter(
        (item) => item.currency === service.currency,
      );
      setAccounts(eligible);
      setAccountId(eligible[0]?.id ?? "");
      attempt.current = null;
      setUncertain(false);
      setStep(PaymentStep.REVIEW);
    });

  const selectedAccount = accounts.find((item) => item.id === accountId);
  const paymentAmount = debt?.amount ?? amount.replace(",", ".");
  let totalCents = 0;
  let enoughBalance = false;
  try {
    if (service) {
      totalCents = toCents(paymentAmount) + toCents(service.commissionAmount);
      enoughBalance =
        !!selectedAccount &&
        toCents(selectedAccount.availableBalance) >= totalCents;
    }
  } catch {
    /* An incomplete amount is expected while editing. */
  }

  const pay = () =>
    run(async () => {
      if (!service || !selectedAccount || !enoughBalance)
        throw new Error("INSUFFICIENT_FUNDS");
      if (!attempt.current) {
        const input: PaymentInput = {
          accountId,
          serviceCode: service.code,
          customerReference: validateReference(service, reference),
          ...(debt
            ? { debtId: debt.id }
            : { amount: validateAmount(service, paymentAmount) / 100 }),
        };
        // A unique request identifier, not an authentication secret.
        attempt.current = {
          input,
          key: `service-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
        };
      }
      try {
        const result = await executeServicePayment(
          attempt.current.input,
          attempt.current.key,
        );
        if (active.current) {
          setReceipt(result);
          setUncertain(false);
          setStep(PaymentStep.RECEIPT);
        }
      } catch (failure) {
        const response = (
          failure as { error?: { response?: { status?: number } } }
        )?.error?.response;
        const definitive =
          response?.status !== undefined &&
          response.status >= 400 &&
          response.status < 500 &&
          response.status !== 408 &&
          response.status !== 429;
        // A confirmed rejection allows editing; ambiguous outcomes keep the exact request.
        if (definitive) attempt.current = null;
        if (active.current) setUncertain(!definitive);
        throw failure;
      }
    });

  const back = useCallback(() => {
    if (operation.current || uncertain) return;
    setError("");
    setStep((current) =>
      current === PaymentStep.REVIEW
        ? PaymentStep.REFERENCE
        : PaymentStep.CATALOG,
    );
  }, [uncertain]);

  const reset = () => {
    if (operation.current) return;
    attempt.current = null;
    setReceipt(null);
    setDebt(null);
    setDebts(null);
    setError("");
    setUncertain(false);
    setStep(PaymentStep.CATALOG);
    setRevision((value) => value + 1);
  };

  return {
    step,
    categories,
    providers,
    query,
    setQuery,
    category,
    setCategory,
    catalogLoading,
    catalogError,
    reload: () => setRevision((value) => value + 1),
    provider,
    service,
    reference,
    changeReference,
    amount,
    setAmount,
    debts,
    debt,
    setDebt,
    accounts,
    accountId,
    setAccountId,
    receipt,
    busy,
    error,
    uncertain,
    paymentAmount,
    totalAmount: (totalCents / 100).toFixed(2),
    enoughBalance,
    selectProvider,
    openSaved,
    changeService,
    inquire,
    review,
    pay,
    back,
    reset,
  };
}
