import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicStatusPage } from '@/features/public-status/pages/public-status-page';
import '@/index.css';

// Separate entry: no AuthProvider, employee storage, private router or interceptors.
const client = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5000 } } });
createRoot(document.getElementById('root')!).render(<StrictMode>
  <QueryClientProvider client={client}><BrowserRouter><PublicStatusPage /></BrowserRouter></QueryClientProvider>
</StrictMode>);
