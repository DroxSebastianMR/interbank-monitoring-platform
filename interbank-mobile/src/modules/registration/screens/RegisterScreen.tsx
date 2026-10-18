import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Check } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import type { AuthStackParamList } from "@/src/application/navigation/AuthNavigator";
import {
  REGISTRATION_STEPS,
  RegistrationStep,
} from "@/src/domain/registration/registration.types";
import { LoginDocumentField } from "@/src/modules/auth/components/LoginDocumentField";
import { useAuthAccessibility } from "@/src/modules/auth/hooks/useAuthAccessibility";
import { RegistrationScaffold } from "@/src/modules/registration/components/RegistrationScaffold";
import { RegistrationSheet } from "@/src/modules/registration/components/RegistrationSheet";
import type { RegistrationSheetTopic } from "@/src/modules/registration/components/RegistrationSheet";
import { RegistrationContactStep } from "@/src/modules/registration/components/RegistrationContactStep";
import { RegistrationVerificationStep } from "@/src/modules/registration/components/RegistrationVerificationStep";
import { RegistrationIdentityStep } from "@/src/modules/registration/components/RegistrationIdentityStep";
import { RegistrationCredentialsStep } from "@/src/modules/registration/components/RegistrationCredentialsStep";
import { RegistrationReviewStep } from "@/src/modules/registration/components/RegistrationReviewStep";
import { RegistrationCompletionStep } from "@/src/modules/registration/components/RegistrationCompletionStep";
import { useRegistration } from "@/src/modules/registration/hooks/useRegistration";
import { BankingActionButton } from "@/src/shared/components/BankingActionButton";
import { BANKING_COLORS as C } from "@/src/shared/theme/banking.theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;
const TITLES: Record<RegistrationStep, string> = {
  DOCUMENT: "Ingresa tu número\nde documento",
  CONTACT: "¿Cómo podemos\ncontactarte?",
  VERIFICATION: "Confirma tu\ncorreo electrónico",
  IDENTITY: "Prepara la validación\nde tu identidad",
  SECURITY: "Crea tu\nacceso digital",
  REVIEW: "Revisa tus\ndatos",
  COMPLETE: "Registro disponible\npróximamente",
};

export function RegisterScreen({ navigation }: Props) {
  const flow = useRegistration();
  const { reduceTransparency, reduceMotion } = useAuthAccessibility();
  const [sheet, setSheet] = useState<RegistrationSheetTopic | null>(null);
  const document = flow.step === RegistrationStep.DOCUMENT;
  const review = flow.step === RegistrationStep.REVIEW;
  const exit = () => {
    Keyboard.dismiss();
    flow.clear();
    navigation.goBack();
  };
  const back = () => {
    Keyboard.dismiss();
    if (!flow.back()) exit();
  };
  const openSheet = (topic: RegistrationSheetTopic) => {
    Keyboard.dismiss();
    setSheet(topic);
  };
  const next = () => {
    Keyboard.dismiss();
    if (flow.complete) exit();
    else if (flow.previewStep) flow.continuePreview();
    else flow.next();
  };

  useEffect(() => {
    const listener = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!navigation.isFocused() || flow.index === 0 || flow.complete)
        return false;
      Keyboard.dismiss();
      flow.back();
      return true;
    });
    return () => listener.remove();
  }, [flow.index, flow.complete, flow.back, navigation]);

  const content = () => {
    switch (flow.step) {
      case RegistrationStep.DOCUMENT:
        return (
          <>
            <LoginDocumentField
              value={flow.draft.documentNumber}
              error={flow.errors.documentNumber}
              disabled={false}
              reduceTransparency={reduceTransparency}
              onChange={(value) => flow.change("documentNumber", value)}
              showLabel={false}
            />
            {flow.errors.documentNumber ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {flow.errors.documentNumber}
              </Text>
            ) : null}
          </>
        );
      case RegistrationStep.CONTACT:
        return <RegistrationContactStep flow={flow} />;
      case RegistrationStep.VERIFICATION:
        return (
          <RegistrationVerificationStep
            email={flow.draft.email}
            opaque={reduceTransparency}
            onEdit={flow.back}
            onRequest={() => openSheet("verification")}
          />
        );
      case RegistrationStep.IDENTITY:
        return (
          <RegistrationIdentityStep
            opaque={reduceTransparency}
            onHelp={() => openSheet("identity")}
          />
        );
      case RegistrationStep.SECURITY:
        return <RegistrationCredentialsStep flow={flow} />;
      case RegistrationStep.REVIEW:
        return <RegistrationReviewStep draft={flow.draft} onEdit={flow.edit} />;
      case RegistrationStep.COMPLETE:
        return <RegistrationCompletionStep opaque={reduceTransparency} />;
    }
  };

  const footer = (
    <>
      {document ? (
        <View style={styles.consentRow}>
          <TouchableOpacity
            accessibilityRole="checkbox"
            accessibilityLabel="He leído y acepto la información de privacidad"
            accessibilityState={{ checked: flow.draft.privacyAccepted }}
            onPress={() =>
              flow.change("privacyAccepted", !flow.draft.privacyAccepted)
            }
            style={styles.checkboxTouch}
          >
            <View
              style={[
                styles.checkbox,
                flow.draft.privacyAccepted && styles.checked,
              ]}
            >
              {flow.draft.privacyAccepted ? (
                <Check size={17} color="#FFFFFF" strokeWidth={2.4} />
              ) : null}
            </View>
          </TouchableOpacity>
          <Text style={styles.consentText}>
            He leído y acepto la{" "}
            <Text
              accessibilityRole="link"
              onPress={() => openSheet("privacy")}
              style={styles.privacyLink}
            >
              información de privacidad.
            </Text>
          </Text>
        </View>
      ) : null}
      <BankingActionButton
        title={
          flow.complete
            ? "Volver al inicio de sesión"
            : flow.previewStep
              ? "Ver siguiente paso"
              : review
                ? "Finalizar vista previa"
                : "Continuar"
        }
        disabled={!flow.complete && !flow.valid}
        opaque={reduceTransparency}
        onPress={next}
      />
    </>
  );

  return (
    <>
      <RegistrationScaffold
        stepKey={flow.step}
        title={TITLES[flow.step]}
        index={flow.index}
        total={REGISTRATION_STEPS.length}
        complete={flow.complete}
        opaque={reduceTransparency}
        onBack={back}
        footer={footer}
      >
        {content()}
      </RegistrationScaffold>
      <RegistrationSheet
        topic={sheet}
        onClose={() => setSheet(null)}
        reduceMotion={reduceMotion}
      />
    </>
  );
}

const styles = StyleSheet.create({
  consentRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginBottom: 19,
  },
  checkboxTouch: {
    width: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#CCD9D0",
    justifyContent: "center",
    alignItems: "center",
  },
  checked: { borderColor: C.green, backgroundColor: C.green },
  consentText: { flex: 1, color: "#617268", fontSize: 13, lineHeight: 21 },
  privacyLink: { color: C.greenDeep, fontWeight: "600" },
  error: { color: "#B54C3C", fontSize: 12, lineHeight: 18, marginTop: 3 },
});
