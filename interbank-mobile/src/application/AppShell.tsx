import { RootNavigator } from "@/src/application/navigation/RootNavigator";
import {
  AppMode,
  useAppState,
} from "@/src/application/runtime/AppStateProvider";
import { useAppRuntime } from "@/src/application/runtime/useAppRuntime";
import { FatalErrorScreen } from "@/src/modules/app-shell/screens/FatalErrorScreen";
import { MaintenanceScreen } from "@/src/modules/app-shell/screens/MaintenanceScreen";
import { OfflineScreen } from "@/src/modules/app-shell/screens/OfflineScreen";
import { SystemUI } from "@/src/modules/system/ui/SystemUI";
import React from "react";

export const AppShell = () => {
  useAppRuntime();
  const { mode } = useAppState();

  return (
    <>
      <AppGate mode={mode} />
      <SystemUI />
    </>
  );
};

const screens: Record<AppMode, React.ReactNode> = {
  loading: null,
  offline: <OfflineScreen />,
  maintenance: <MaintenanceScreen />,
  fatal: <FatalErrorScreen />,
  "update-required": <MaintenanceScreen />,
  ready: <RootNavigator />,
};

const AppGate = ({ mode }: { mode: AppMode }) => {
  return screens[mode] ?? <FatalErrorScreen />;
};
