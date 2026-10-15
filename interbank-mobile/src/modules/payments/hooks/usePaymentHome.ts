import { useCallback, useEffect, useState } from "react";
import type {
  SavedServicePayment,
  ServiceProvider,
} from "@/src/domain/payments/payment.types";
import {
  getSavedServicePayments,
  searchPaymentProviders,
} from "@/src/domain/payments/payments.usecase";

export function usePaymentHome(enabled: boolean) {
  const [recommended, setRecommended] = useState<ServiceProvider[]>([]);
  const [saved, setSaved] = useState<SavedServicePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    void getSavedServicePayments(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setSaved(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    void searchPaymentProviders("", undefined, controller.signal)
      .then((result) => {
        // Editorial selection from the active catalogue; no synthetic usage ranking.
        const priority = /claro|movistar|entel|bitel|sedapal|luz/i;
        const ordered = [...result].sort(
          (a, b) =>
            Number(priority.test(b.name)) - Number(priority.test(a.name)),
        );
        if (!controller.signal.aborted) setRecommended(ordered.slice(0, 4));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [enabled, revision]);

  return { recommended, saved, loading, error, reload };
}
