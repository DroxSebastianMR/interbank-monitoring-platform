import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AuthProvider } from '@/app/providers/auth/auth-provider';
import { setupInterceptors } from '@/infrastructure/api/client/axios.interceptors';

setupInterceptors();

const client = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
