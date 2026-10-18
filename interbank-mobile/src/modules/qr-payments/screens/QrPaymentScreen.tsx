import { QrCode } from "lucide-react-native";
import React from "react";
import { BankingPlaceholderScreen } from "@/src/shared/components/BankingPlaceholderScreen";

export function QrPaymentScreen() {
  return (
    <BankingPlaceholderScreen
      title="Pagar con QR"
      description="El módulo de cámara quedó preparado para integrarse con el flujo bancario de pagos QR."
      icon={QrCode}
    />
  );
}
