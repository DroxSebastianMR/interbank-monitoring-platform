import { useSystemUI } from "@/src/modules/system/ui/hooks/useSystemUI";
import { GlobalLoader } from "@/src/modules/system/ui/overlays/GlobalLoader";
import { GlobalModal } from "@/src/modules/system/ui/overlays/GlobalModal";
import { GlobalToast } from "@/src/modules/system/ui/overlays/GlobalToast";

export const SystemUI = () => {
  const { state } = useSystemUI();

  return (
    <>
      {state.loading && <GlobalLoader />}
      {state.toast && <GlobalToast toast={state.toast} />}
      {state.modal && <GlobalModal>{state.modal}</GlobalModal>}
    </>
  );
};
