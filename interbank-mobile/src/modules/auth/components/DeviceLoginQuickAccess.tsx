import { ArrowRight, MessageCircle, QrCode } from "lucide-react-native";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import { LiquidGlassSurface } from "@/src/shared/components/LiquidGlassSurface";
import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

interface Props {
  onQrPress: () => void;
  onWhatsAppPress: () => void;
  disabled: boolean;
  reduceTransparency: boolean;
}

export function DeviceLoginQuickAccess({
  onQrPress,
  onWhatsAppPress,
  disabled,
  reduceTransparency,
}: Props) {
  const { height } = useWindowDimensions();
  const compact = height < 750;
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onQrPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Información de tu QR personal"
        style={[styles.qrButton, compact && styles.qrCompact]}
      >
        <LiquidGlassSurface
          tone="neutral"
          intensity={20}
          opaque={reduceTransparency}
          style={styles.qrSurface}
        >
          <View style={styles.qrContent}>
            <QrCode
              size={compact ? 54 : 72}
              strokeWidth={1.5}
              color={BANKING_COLORS.greenDeep}
            />
            <Text style={styles.qrTitle}>Tu QR personal</Text>
            <Text style={styles.qrHint}>Próximamente</Text>
          </View>
        </LiquidGlassSurface>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onWhatsAppPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Información de Plinear por WhatsApp"
        style={styles.whatsApp}
      >
        <View style={styles.whatsAppIcon}>
          <MessageCircle size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.whatsAppText}>Plinear por WhatsApp</Text>
        <View style={styles.soon}>
          <Text style={styles.soonText}>Pronto</Text>
        </View>
        <ArrowRight size={18} color="#DAF5B6" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", gap: 22 },
  qrButton: {
    width: 184,
    height: 174,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.92)",
    boxShadow: "0 10px 24px rgba(0,80,36,0.10)",
  },
  qrCompact: { height: 146, width: 166 },
  qrSurface: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  qrContent: { zIndex: 1, alignItems: "center", gap: 5 },
  qrTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: BANKING_COLORS.ink,
    marginTop: 2,
  },
  qrHint: { fontSize: 10, color: "#62776B" },
  whatsApp: {
    width: "100%",
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: BANKING_COLORS.greenDeep,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 13,
  },
  whatsAppIcon: {
    width: 30,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  whatsAppText: { flex: 1, color: "#FFFFFF", fontSize: 13, fontWeight: "500" },
  soon: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 8,
  },
  soonText: { color: "#DAF5B6", fontSize: 10, fontWeight: "600" },
});
