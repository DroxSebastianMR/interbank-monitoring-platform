import { CreditCard } from "lucide-react-native";
import React from "react";
import { BankingPlaceholderScreen } from "@/src/shared/components/BankingPlaceholderScreen";

export function AccountsScreen() {
  return (
    <BankingPlaceholderScreen
      title="Mis cuentas"
      description="Aquí mostraremos cuentas en soles y dólares, saldos y movimientos."
      icon={CreditCard}
    />
  );
}
