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
import { BANKING_COLORS } from "@/src/shared/theme/banking.theme";

export function DeviceLoginScreen() {
  const {
    user,
    password,
    loading,
    passwordMode,
    biometric,
    biometricLabel,
    pendingEnrollment,
    sessionRecoveryNeeded,
    isValid,
    setPassword,
    setPasswordMode,
    handleBeginBiometricSetup,
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
          {pendingEnrollment ? (
            <View style={styles.enrollmentNotice}>
              <Text
                style={styles.enrollmentTitle}
              >{`Activando ${biometricLabel} · paso 1 de 2`}</Text>
              <Text style={styles.enrollmentBody}>
                Ingresa tu contraseña. Después, tu teléfono te pedirá confirmar
                tu identidad y guardaremos el acceso protegido.
              </Text>
            </View>
          ) : null}
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
          {sessionRecoveryNeeded ? (
            <View style={styles.recoveryNotice}>
              <Text style={styles.recoveryText}>
                No pudimos validar este acceso. Si la sesión del dispositivo
                venció, vuelve a ingresar con tu DNI, correo y contraseña.
              </Text>
              <TouchableOpacity
                onPress={() => void handleUseAnotherAccount()}
                accessibilityRole="button"
                style={styles.recoveryButton}
              >
                <Text style={styles.recoveryButtonText}>
                  Ingresar con todos mis datos
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {biometric.kind !== BiometricKind.NONE ? (
            <DeviceBiometricControl
              kind={biometric.kind}
              enabled={biometric.enabled}
              available={biometric.available}
              disabled={loading}
              checking={biometric.checking}
              pendingEnrollment={pendingEnrollment}
              reduceTransparency={reduceTransparency}
              onToggle={(value) =>
                value
                  ? openHelp("biometric")
                  : void handleToggleBiometrics(false)
              }
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
            onPress={() =>
              biometric.enabled
                ? void handleBiometricLogin()
                : openHelp("biometric")
            }
            disabled={
              loading ||
              biometric.checking ||
              (biometric.enabled && !biometric.available)
            }
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
        biometricLabel={biometricLabel}
        biometricAvailable={biometric.available}
        onBiometricSetup={handleBeginBiometricSetup}
      />
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
  enrollmentNotice: {
    backgroundColor: "#EAF6EF",
    borderColor: "#CDE8D6",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  enrollmentTitle: {
    color: BANKING_COLORS.greenDeep,
    fontSize: 14,
    fontWeight: "700",
  },
  enrollmentBody: {
    color: "#51685B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  recoveryNotice: {
    backgroundColor: "#F2F6F3",
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  recoveryText: { color: "#34483B", fontSize: 12, lineHeight: 18 },
  recoveryButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    marginTop: 6,
  },
  recoveryButtonText: {
    color: BANKING_COLORS.greenDeep,
    fontWeight: "700",
    fontSize: 13,
  },
  anotherAccount: { fontSize: 12, color: "#65786B", textAlign: "center" },
  version: {
    marginTop: 12,
    fontSize: 10,
    color: "#718379",
    textAlign: "center",
  },
});
