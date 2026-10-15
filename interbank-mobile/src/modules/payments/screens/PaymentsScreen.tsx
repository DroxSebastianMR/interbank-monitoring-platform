import { ReceiptText } from "lucide-react-native";
import React from "react";
import { BankingPlaceholderScreen } from "@/src/shared/components/BankingPlaceholderScreen";

export function PaymentsScreen() {
  return (
    <BankingPlaceholderScreen
      title="Pagos"
      description="Consulta empresas, recibos pendientes y tus pagos frecuentes."
      icon={ReceiptText}
    />
  );
}
