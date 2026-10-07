import { Fingerprint, KeyRound, ScanFace } from "lucide-react-native";
import React, { useState } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { APP_CONFIG } from "@/src/config/app.config";
import { BiometricKind } from "@/src/domain/auth/biometric.types";
import { AuthInput } from "@/src/modules/auth/components/AuthInput";
import { DeviceBiometricControl } from "@/src/modules/auth/components/DeviceBiometricControl";
import { DeviceLoginQuickAccess } from "@/src/modules/auth/components/DeviceLoginQuickAccess";
import { DeviceLoginScaffold } from "@/src/modules/auth/components/DeviceLoginScaffold";
import { LoginHelpSheet } from "@/src/modules/auth/components/LoginHelpSheet";
import type { LoginHelpTopic } from "@/src/modules/auth/components/LoginHelpSheet";
import { LoginSubmitButton } from "@/src/modules/auth/components/LoginSubmitButton";
import { useAuthAccessibility } from "@/src/modules/auth/hooks/useAuthAccessibility";
import { useDeviceLogin } from "@/src/modules/auth/hooks/useDeviceLogin";
import { ScreenLoader } from "@/src/modules/system/ui/components/ScreenLoader";
import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

export function DeviceLoginScreen() {
  const {
    user,
    password,
    loading,
    passwordMode,
    biometric,
    pendingEnrollment,
    isValid,
    setPassword,
    setPasswordMode,
    handleDeviceLogin,
    handleBiometricLogin,
    handleToggleBiometrics,
    handleUseAnotherAccount,
    handleLockDevice,
  } = useDeviceLogin();
  const { reduceTransparency, reduceMotion } = useAuthAccessibility();
  const [helpTopic, setHelpTopic] = useState<LoginHelpTopic>("menu");
  const [helpVisible, setHelpVisible] = useState(false);
  const faceId = biometric.kind === BiometricKind.FACE_ID;

  const openHelp = (topic: LoginHelpTopic) => {
    if (loading) return;
    Keyboard.dismiss();
    setHelpTopic(topic);
    setHelpVisible(true);
  };

  return (
    <DeviceLoginScaffold
      firstName={user?.firstName}
      disabled={loading}
      reduceTransparency={reduceTransparency}
      onMenuPress={() => openHelp("menu")}
      onLockPress={handleLockDevice}
      quickAccess={
        <DeviceLoginQuickAccess
          disabled={loading}
          reduceTransparency={reduceTransparency}
          onQrPress={() => openHelp("qr")}
          onWhatsAppPress={() => openHelp("whatsapp")}
        />
      }
    >
      {passwordMode ? (
        <>
          <AuthInput
            variant="login"
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            icon={<KeyRound color="#72867A" size={20} strokeWidth={1.7} />}
            secure
            value={password}
            editable={!loading}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={() => {
              Keyboard.dismiss();
              void handleDeviceLogin();
            }}
          />
          <LoginSubmitButton
            onPress={() => {
              Keyboard.dismiss();
              void handleDeviceLogin();
            }}
            disabled={loading || !isValid}
            loading={loading}
            reduceTransparency={reduceTransparency}
          />
          {biometric.kind !== BiometricKind.NONE ? (
            <DeviceBiometricControl
              kind={biometric.kind}
              enabled={biometric.enabled}
              available={biometric.available}
              disabled={loading}
              checking={biometric.checking}
              pendingEnrollment={pendingEnrollment}
              reduceTransparency={reduceTransparency}
              onToggle={(value) => void handleToggleBiometrics(value)}
            />
          ) : null}
          {faceId && biometric.enabled ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setPassword("");
                setPasswordMode(false);
              }}
              disabled={loading}
              accessibilityRole="button"
              style={styles.textAction}
            >
              <Text style={styles.linkText}>Ingresar con Face ID</Text>
            </TouchableOpacity>
          ) : null}
          {!faceId && biometric.enabled && biometric.available ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void handleBiometricLogin()}
              disabled={loading}
              accessibilityRole="button"
              style={styles.fingerprintAction}
            >
              <Fingerprint size={20} color={BANKING_COLORS.blueAction} />
              <Text style={styles.fingerprintText}>
                Ingresar con huella digital
              </Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : (
        <View style={styles.faceLogin}>
          <LoginSubmitButton
            title={
              biometric.enabled ? "Ingresar con Face ID" : "Activar Face ID"
            }
            icon={<ScanFace size={24} color="#FFFFFF" />}
            onPress={() => void handleBiometricLogin()}
            disabled={loading || biometric.checking || !biometric.available}
            loading={loading}
            reduceTransparency={reduceTransparency}
          />
          {!biometric.available ? (
            <Text style={styles.biometricHint}>
              {biometric.checking
                ? "Preparando Face ID…"
                : "Face ID no está disponible. Puedes ingresar con contraseña."}
            </Text>
          ) : null}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPasswordMode(true)}
            disabled={loading}
            accessibilityRole="button"
            style={styles.textAction}
          >
            <Text style={styles.passwordLink}>Ingresar con contraseña</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => openHelp("password")}
        disabled={loading}
        accessibilityRole="button"
        style={styles.textAction}
      >
        <Text style={styles.linkText}>Olvidé mi contraseña</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => void handleUseAnotherAccount()}
          disabled={loading}
          accessibilityRole="button"
          style={styles.textAction}
        >
          <Text style={styles.anotherAccount}>Ingresar con otra cuenta</Text>
        </TouchableOpacity>
        <Text style={styles.version}>v{APP_CONFIG.VERSION}</Text>
      </View>
      <LoginHelpSheet
        visible={helpVisible}
        topic={helpTopic}
        onSelect={setHelpTopic}
        onClose={() => setHelpVisible(false)}
        reduceMotion={reduceMotion}
      />
      <ScreenLoader visible={loading} />
    </DeviceLoginScaffold>
  );
}

const styles = StyleSheet.create({
  faceLogin: { gap: 10 },
  textAction: {
    minHeight: 44,
    paddingVertical: 12,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    color: BANKING_COLORS.greenDeep,
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
    textAlign: "center",
  },
  passwordLink: {
    color: BANKING_COLORS.ink,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  biometricHint: {
    color: "#65786B",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },
  fingerprintAction: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "#EAF0FC",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  fingerprintText: {
    color: BANKING_COLORS.blueAction,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  footer: { marginTop: "auto", paddingTop: 20 },
  anotherAccount: { fontSize: 12, color: "#65786B", textAlign: "center" },
  version: {
    marginTop: 12,
    fontSize: 10,
    color: "#718379",
    textAlign: "center",
  },
});
