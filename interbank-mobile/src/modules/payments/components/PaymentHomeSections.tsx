import { ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type {
  SavedServicePayment,
  ServiceProvider,
} from "@/src/domain/payments/payment.types";
import { PaymentProviderMark } from "./PaymentProviderMark";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

interface Props {
  recommended: ServiceProvider[];
  saved: SavedServicePayment[];
  loading: boolean;
  error: boolean;
  disabled: boolean;
  onProvider: (provider: ServiceProvider) => void;
  onSaved: (saved: SavedServicePayment) => void;
  onRetry: () => void;
}

export function PaymentHomeSections({
  recommended,
  saved,
  loading,
  error,
  disabled,
  onProvider,
  onSaved,
  onRetry,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.home}>
      {recommended.length ? (
        <View style={styles.recommendations}>
          <Text style={styles.heading}>Te recomendamos pagar</Text>
          <View style={styles.recommendationRow}>
            {recommended.map((item) => (
              <TouchableOpacity
                key={item.code}
                accessibilityRole="button"
                accessibilityLabel={`Pagar ${item.name}`}
                disabled={disabled}
                onPress={() => onProvider(item)}
                activeOpacity={0.75}
                style={styles.recommendation}
              >
                <PaymentProviderMark
                  name={item.shortName || item.name}
                  logoUrl={item.logoUrl}
                  large
                />
                <Text style={styles.recommendationName} numberOfLines={2}>
                  {item.shortName || item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
      <View style={styles.frequent}>
        <View style={styles.frequentHeading}>
          <Text style={styles.heading}>Tus servicios frecuentes</Text>
        </View>
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator
              color={C.green}
              accessibilityLabel="Cargando servicios frecuentes"
            />
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No pudimos cargar tus servicios.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onRetry}
              style={styles.linkButton}
            >
              <Text style={styles.link}>Volver a intentar</Text>
            </TouchableOpacity>
          </View>
        ) : !saved.length ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              no hay pagos frecuentes todavia
            </Text>
          </View>
        ) : (
          <>
            {(expanded ? saved : saved.slice(0, 3)).map((item) => (
              <TouchableOpacity
                key={item.id}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`Pagar ${item.alias}`}
                onPress={() => onSaved(item)}
                activeOpacity={0.75}
                style={styles.savedRow}
              >
                <PaymentProviderMark
                  name={item.provider.shortName || item.provider.name}
                  logoUrl={item.provider.logoUrl}
                />
                <View style={styles.savedCopy}>
                  <Text style={styles.alias}>{item.alias}</Text>
                  <Text style={styles.savedService}>
                    {item.provider.shortName || item.provider.name} ·{" "}
                    {item.service.name}
                  </Text>
                  <Text style={styles.reference}>
                    {item.service.referenceLabel}: {item.customerReference}
                  </Text>
                </View>
                <ChevronRight size={19} color="#8B9B91" />
              </TouchableOpacity>
            ))}
            {saved.length > 3 ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setExpanded((value) => !value)}
                style={styles.viewAll}
              >
                <Text style={styles.link}>
                  {expanded ? "Ver menos" : "Ver todos mis servicios"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  home: { marginBottom: 30 },
  heading: {
    color: C.ink,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.35,
    flexShrink: 1,
  },
  recommendations: { marginTop: 6, marginBottom: 27 },
  recommendationRow: { flexDirection: "row", marginTop: 19, gap: 6 },
  recommendation: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 10,
    minHeight: 101,
  },
  recommendationName: {
    color: C.ink,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  frequent: {
    paddingHorizontal: 0,
  },
  frequentHeading: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 19,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1EE",
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1EE",
  },
  savedCopy: { flex: 1 },
  alias: { fontSize: 15, fontWeight: "600", color: C.ink },
  savedService: {
    color: "#6C7F73",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  reference: { color: "#8A978F", fontSize: 12, lineHeight: 18, marginTop: 3 },
  empty: { paddingVertical: 22, gap: 8 },
  emptyText: { color: "#7A8A80", fontSize: 13, lineHeight: 20 },
  linkButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
  },
  link: { color: C.greenDeep, fontWeight: "600", fontSize: 13 },
  viewAll: { minHeight: 48, alignItems: "center", justifyContent: "center" },
});
