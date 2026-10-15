export type ToastType = "success" | "error" | "info";

export type ToastPayload = {
  message: string;
  type?: ToastType; // opcional (correcto para tu caso)
};

export type SystemUIState = {
  loading: boolean;
  toast?: ToastPayload;
  modal?: React.ReactNode;
};
