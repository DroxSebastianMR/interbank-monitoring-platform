import { AppStateProvider } from "@/src/application/runtime/AppStateProvider";
import { AuthProvider } from "@/src/modules/auth/context/AuthProvider";
import { AppBootstrap } from "@/src/modules/bootstrap/AppBootstrap";
import { SystemUIProvider } from "@/src/modules/system/ui/SystemUIProvider";

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SystemUIProvider>
      <AppStateProvider>
        <AuthProvider>
          <AppBootstrap>{children}</AppBootstrap>
        </AuthProvider>
      </AppStateProvider>
    </SystemUIProvider>
  );
};
