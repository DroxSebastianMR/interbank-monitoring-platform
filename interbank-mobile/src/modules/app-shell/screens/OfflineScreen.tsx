import { useAppState } from "@/src/application/runtime/AppStateProvider";

import { StubScreen } from "@/src/modules/app-shell/screens/StubScreen";

export const OfflineScreen = () => {
  const { retryBootstrap } = useAppState();

  return (
    <StubScreen
      title="Sin conexión"
      message="No se pudo conectar con el servidor."
      showRetry
      onRetry={retryBootstrap}
    />
  );
};
