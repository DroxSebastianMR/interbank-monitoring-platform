import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/app/providers/app-providers';
import { router } from '@/app/router/app-router';

export function App() {
  return <AppProviders><RouterProvider router={router} /></AppProviders>;
}
