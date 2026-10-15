import { ChevronRight, LayoutGrid } from "lucide-react-native";
import React from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type {
  ServiceCategory,
  ServiceProvider,
} from "@/src/domain/payments/payment.types";
import { PaymentNotice, ServiceIcon } from "./PaymentPrimitives";
import { PaymentProviderMark } from "./PaymentProviderMark";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

interface Props {
  categories: ServiceCategory[];
  providers: ServiceProvider[];
  query: string;
  category: string;
  loading: boolean;
  error: string;
  disabled: boolean;
  children?: ReactNode;
  onCategory: (value: string) => void;
  onSelect: (provider: ServiceProvider) => void;
  onRetry: () => void;
}

export function PaymentCatalog({
  categories,
  providers,
  query,
  category,
  loading,
  error,
  disabled,
  children,
  onCategory,
  onSelect,
  onRetry,
}: Props) {
  const selectedCategory = categories.find((item) => item.code === category);
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.filters}
      >
        {[{ code: "", name: "Todos", iconKey: "all" }, ...categories].map(
          (item) => (
            <TouchableOpacity
              key={item.code}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: item.code === category }}
              onPress={() => onCategory(item.code)}
              style={[
                styles.chip,
                item.code === category && styles.selectedChip,
              ]}
            >
              {item.code ? (
                <ServiceIcon
                  name={`${item.iconKey} ${item.name}`}
                  color={item.code === category ? "#FFFFFF" : C.green}
                  size={18}
                />
              ) : (
                <LayoutGrid size={17} color={category ? C.green : "#FFFFFF"} />
              )}
              <Text
                style={[
                  styles.chipText,
                  item.code === category && styles.selectedText,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </ScrollView>
      {!query && !category ? children : null}
      {query.trim() || category ? (
        <>
          <View style={styles.section}>
            <Text style={styles.heading}>
              {query
                ? "Resultados de búsqueda"
                : selectedCategory?.name || "Servicios"}
            </Text>
            {category ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => onCategory("")}
                style={styles.clear}
              >
                <Text style={styles.clearText}>Ver todas</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator
                accessibilityLabel="Buscando empresas"
                color={C.green}
              />
            </View>
          ) : error ? (
            <PaymentNotice
              title="No pudimos cargar las empresas"
              description={error}
              action="Volver a intentar"
              onPress={onRetry}
            />
          ) : !providers.length ? (
            <PaymentNotice
              title="No encontramos la empresa"
              description="Prueba con otro nombre o revisa otro rubro."
            />
          ) : (
            <View style={styles.grid}>
              {providers.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Pagar ${item.name}`}
                  disabled={disabled}
                  onPress={() => onSelect(item)}
                  style={styles.company}
                >
                  <PaymentProviderMark
                    name={item.shortName || item.name}
                    logoUrl={item.logoUrl}
                  />
                  <Text style={styles.companyName} numberOfLines={2}>
                    {item.shortName || item.name}
                  </Text>
                  <ChevronRight size={14} color="#96A49B" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {providers.length === 50 ? (
            <Text style={styles.limit}>
              Usa el buscador para encontrar más empresas.
            </Text>
          ) : null}
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  filters: { gap: 9, paddingVertical: 23 },
  chip: {
    minHeight: 39,
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3AB96B",
    borderRadius: 23,
    paddingHorizontal: 14,
  },
  selectedChip: { backgroundColor: C.green, borderColor: C.green },
  chipText: { color: C.greenDeep, fontSize: 13, fontWeight: "500" },
  selectedText: { color: "#FFFFFF" },
  section: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 17,
  },
  heading: {
    color: C.ink,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.35,
    flex: 1,
  },
  clear: { minHeight: 44, justifyContent: "center" },
  clearText: { color: C.greenDeep, fontSize: 13, fontWeight: "600" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 13,
    paddingBottom: 12,
  },
  company: {
    width: "48%",
    minHeight: 88,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EDF1EE",
    boxShadow: "0 3px 10px rgba(17,55,34,0.045)",
  },
  companyName: {
    flex: 1,
    color: "#123745",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  loading: { alignItems: "center", paddingVertical: 35 },
  limit: {
    color: "#78877E",
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 12,
  },
});
