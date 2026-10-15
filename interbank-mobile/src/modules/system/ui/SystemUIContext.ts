import { SystemUIState } from "@/src/modules/system/ui/types";
import { createContext } from "react";

export type SystemUIContextType = {
  state: SystemUIState;
  showLoader: () => void;
  hideLoader: () => void;
  showToast: (payload: {
    message: string;
    type?: "success" | "error" | "info";
  }) => void;
  hideToast: () => void;
  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;
};

export const SystemUIContext = createContext<SystemUIContextType | null>(null);
