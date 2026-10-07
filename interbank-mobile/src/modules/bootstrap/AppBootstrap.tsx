import React, { useCallback, useEffect, useState } from "react";

import { useAppState } from "@/src/application/runtime/AppStateProvider";
import { verifyBackendAvailability } from "@/src/domain/system/system.usecase";
import { BootstrapLoader } from "@/src/modules/bootstrap/components/BootstrapLoader";

export function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { setMode, setRetryBootstrap } = useAppState();
  const [bootstrapFinished, setBootstrapFinished] = useState(false);
  const [loaderFinished, setLoaderFinished] = useState(false);

  const runBootstrap = useCallback(async (): Promise<void> => {
    setBootstrapFinished(false);
    setLoaderFinished(false);
    setMode("loading");
    try {
      await verifyBackendAvailability();
      setMode("ready");
    } catch {
      setMode("offline");
    } finally {
      setBootstrapFinished(true);
    }
  }, [setMode]);

  useEffect(() => {
    setRetryBootstrap(runBootstrap);
    const timeout = setTimeout(() => void runBootstrap(), 0);
    return () => clearTimeout(timeout);
  }, [runBootstrap, setRetryBootstrap]);

  const handleLoaderFinished = useCallback(() => {
    setLoaderFinished(true);
  }, []);

  if (!loaderFinished) {
    return (
      <BootstrapLoader
        completed={bootstrapFinished}
        onFinish={handleLoaderFinished}
      />
    );
  }
  return <>{children}</>;
}
