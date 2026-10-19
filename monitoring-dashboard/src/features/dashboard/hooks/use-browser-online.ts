import { useSyncExternalStore } from "react";
const subscribe = (listener: () => void) => {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
};
export const useBrowserOnline = () =>
  useSyncExternalStore(
    subscribe,
    () => typeof navigator === "undefined" || navigator.onLine,
    () => true,
  );
