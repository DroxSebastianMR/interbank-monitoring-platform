import { useCallback, useEffect, useState } from "react";

import { getHomeSummary } from "@/src/domain/home/home.usecase";
import type { HomeResponse } from "@/src/infrastructure/api/home/services/home.types";

export function useHomeSummary() {
  const [data, setData] = useState<HomeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(false);
      setData(await getHomeSummary());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void getHomeSummary()
      .then((response) => {
        if (!active) return;
        setData(response);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error, reload };
}
