import { Bookmark, Check } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { ServicePaymentReceipt } from "@/src/domain/payments/payment.types";
import { saveServicePayment } from "@/src/domain/payments/payments.usecase";
import { paymentErrorMessage } from "@/src/modules/payments/utils/payment-format";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function SaveFrequentService({
  receipt,
}: {
  receipt: ServicePaymentReceipt;
}) {
  const [expanded, setExpanded] = useState(false);
  const [alias, setAlias] = useState(
    (receipt.provider.shortName || receipt.provider.name).slice(0, 80),
  );
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(true);
  const submitting = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const save = async () => {
    if (submitting.current || !alias.trim()) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await saveServicePayment({
        serviceCode: receipt.service.code,
        customerReference: receipt.customerReference,
        alias: alias.trim(),
      });
      if (active.current) setSaved(true);
    } catch (failure) {
      if (active.current) setError(paymentErrorMessage(failure));
    } finally {
      submitting.current = false;
      if (active.current) setBusy(false);
    }
  };

  if (saved)
    return (
      <View accessibilityLiveRegion="polite" style={styles.saved}>
        <Check color={C.greenDeep} size={18} />
        <Text style={styles.savedText}>
          Guardado en tus servicios frecuentes
        </Text>
      </View>
    );
  return (
    <View style={styles.section}>
      {!expanded ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => setExpanded(true)}
          style={styles.trigger}
        >
          <Bookmark color={C.greenDeep} size={19} />
          <Text style={styles.triggerText}>
            Guardar en servicios frecuentes
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={styles.label}>Dale un nombre a este servicio</Text>
          <TextInput
            accessibilityLabel="Nombre del servicio frecuente"
            value={alias}
            editable={!busy}
            onChangeText={setAlias}
            placeholder="Por ejemplo, luz de casa"
            maxLength={80}
            style={styles.input}
          />
          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.error}>
              {error}
            </Text>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ busy, disabled: busy || !alias.trim() }}
            disabled={busy || !alias.trim()}
            onPress={() => void save()}
            style={styles.trigger}
          >
            {busy ? (
              <ActivityIndicator color={C.greenDeep} />
            ) : (
              <Bookmark color={C.greenDeep} size={18} />
            )}
            <Text style={styles.triggerText}>
              {busy ? "Guardando…" : "Guardar servicio"}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 20 },
  trigger: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  triggerText: {
    color: C.greenDeep,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  label: { fontSize: 13, color: C.ink, fontWeight: "500", marginBottom: 10 },
  input: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#F3F7F4",
    paddingHorizontal: 15,
    fontSize: 14,
    color: C.ink,
  },
  saved: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  savedText: { color: C.greenDeep, fontSize: 13, flexShrink: 1 },
  error: { color: "#A23E36", fontSize: 12, lineHeight: 18, marginTop: 8 },
});
