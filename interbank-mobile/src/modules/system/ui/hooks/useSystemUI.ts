import { SystemUIContext } from "@/src/modules/system/ui/SystemUIContext";
import { useContext } from "react";

export const useSystemUI = () => {
  const context = useContext(SystemUIContext);

  if (!context) {
    throw new Error("useSystemUI must be used inside SystemUIProvider");
  }

  return context;
};
