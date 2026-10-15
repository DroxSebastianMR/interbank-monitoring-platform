import { SystemUIContext } from "@/src/modules/system/ui/SystemUIContext";
import { SystemUIState, ToastPayload } from "@/src/modules/system/ui/types";
import React, { useCallback, useMemo, useState } from "react";

export const SystemUIProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, setState] = useState<SystemUIState>({
    loading: false,
  });

  const showLoader = useCallback((): void => {
    setState((s) => ({ ...s, loading: true }));
  }, []);

  const hideLoader = useCallback((): void => {
    setState((s) => ({ ...s, loading: false }));
  }, []);

  const showToast = useCallback((toast: ToastPayload): void => {
    setState((s) => ({ ...s, toast }));

    setTimeout(() => {
      setState((s) => ({ ...s, toast: undefined }));
    }, 3000);
  }, []);

  const hideToast = useCallback((): void => {
    setState((s) => ({ ...s, toast: undefined }));
  }, []);

  const showModal = useCallback((modal: React.ReactNode): void => {
    setState((s) => ({ ...s, modal }));
  }, []);

  const hideModal = useCallback((): void => {
    setState((s) => ({ ...s, modal: undefined }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      showLoader,
      hideLoader,
      showToast,
      hideToast,
      showModal,
      hideModal,
    }),
    [state, showLoader, hideLoader, showToast, hideToast, showModal, hideModal],
  );

  return (
    <SystemUIContext.Provider value={value}>
      {children}
    </SystemUIContext.Provider>
  );
};
