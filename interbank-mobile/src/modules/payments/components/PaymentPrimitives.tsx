import { LinearGradient } from "expo-linear-gradient";
import {
  Droplets,
  GraduationCap,
  HeartPulse,
  Lightbulb,
  Landmark,
  ReceiptText,
  Smartphone,
  Wifi,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

export function ServiceIcon({
  name,
  size = 23,
  color = C.greenDeep,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const key = name.toLowerCase();
  const Icon: LucideIcon = /water|agua|drop/.test(key)
    ? Droplets
    : /electric|light|luz|utilit/.test(key)
      ? Lightbulb
      : /phone|mobile|telecom|celular/.test(key)
        ? Smartphone
        : /internet|wifi/.test(key)
          ? Wifi
          : /educat|school/.test(key)
            ? GraduationCap
            : /health|salud/.test(key)
              ? HeartPulse
              : /landmark|government|impuesto|municip/.test(key)
                ? Landmark
                : ReceiptText;
  return <Icon size={size} color={color} strokeWidth={1.8} />;
}

export function PaymentAction({
  title,
  busy = false,
  disabled = false,
  opaque,
  onPress,
}: {
  title: string;
  busy?: boolean;
  disabled?: boolean;
  opaque: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.button, (disabled || busy) && styles.disabled]}
    >
      {!opaque && (
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.23)",
            "rgba(255,255,255,0)",
            "rgba(13,47,135,0.12)",
          ]}
          style={StyleSheet.absoluteFill}
        />
      )}
      {busy ? <ActivityIndicator color="#FFFFFF" /> : null}
      <Text style={styles.buttonText}>{busy ? "Un momento…" : title}</Text>
    </TouchableOpacity>
  );
}

export function PaymentNotice({
  title,
  description,
  action,
  onPress,
}: {
  title: string;
  description?: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      <Text style={styles.noticeTitle}>{title}</Text>
      {description ? <Text style={styles.muted}>{description}</Text> : null}
      {action && onPress ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onPress}
          style={styles.noticeAction}
        >
          <Text style={styles.link}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function DetailRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.detail}>
      <Text style={styles.muted}>{label}</Text>
      <Text selectable style={[styles.value, strong && styles.strong]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: C.blueAction,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginTop: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  disabled: { opacity: 0.5 },
  notice: {
    borderRadius: 10,
    padding: 16,
    backgroundColor: "#F3F6F4",
    gap: 8,
    marginVertical: 12,
  },
  noticeTitle: { color: C.ink, fontWeight: "600", fontSize: 15 },
  noticeAction: {
    minHeight: 44,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  link: { color: C.blueAction, fontSize: 14, fontWeight: "600" },
  muted: { color: "#607368", fontSize: 13, lineHeight: 20, flexShrink: 1 },
  detail: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2EF",
  },
  value: {
    color: C.ink,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "right",
    flex: 1,
  },
  strong: { fontSize: 23, color: C.greenDeep },
});
