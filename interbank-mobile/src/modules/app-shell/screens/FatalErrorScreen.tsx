import { useAppState } from "@/src/application/runtime/AppStateProvider";

import { StubScreen } from "@/src/modules/app-shell/screens/StubScreen";

export const FatalErrorScreen = () => {
  const { retryBootstrap } = useAppState();

  return (
    <StubScreen
      title="Error crítico"
      message="Ocurrió un problema inesperado. Intenta nuevamente."
      showRetry
      onRetry={retryBootstrap}
    />
  );
};
