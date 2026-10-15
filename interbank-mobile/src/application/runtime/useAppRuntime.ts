import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useAppState } from "./AppStateProvider";

export const useAppRuntime = () => {
  const { setMode } = useAppState();

  useEffect(() => {
    // En web, la disponibilidad real ya se valida contra GET /health durante
    // el bootstrap. NetInfo depende de APIs del navegador que algunos webviews
    // no exponen de forma fiable y puede generar un falso estado sin conexión.
    if (Platform.OS === "web") return undefined;

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected === false) {
        setMode("offline");
      }
    });

    return unsubscribe;
  }, [setMode]);

  return {};
};
