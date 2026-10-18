import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export interface ModuleHeaderContextValue {
  setModuleChild: (name: string | null) => void;
  setModuleActions: (actions: ReactNode) => void;
}

export const ModuleHeaderContext = createContext<ModuleHeaderContextValue | null>(null);

export function useModuleHeader(): ModuleHeaderContextValue {
  const context = useContext(ModuleHeaderContext);
  if (!context) {
    throw new Error('useModuleHeader debe usarse dentro de OperationsLayout');
  }
  return context;
}
