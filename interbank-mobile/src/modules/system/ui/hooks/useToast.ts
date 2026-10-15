import { useSystemUI } from "@/src/modules/system/ui/hooks/useSystemUI";

export const useToast = () => {
  const { showToast, hideToast } = useSystemUI();

  const show = (
    message: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    showToast({ message, type });

    setTimeout(() => {
      hideToast();
    }, 3000);
  };

  return { show };
};
