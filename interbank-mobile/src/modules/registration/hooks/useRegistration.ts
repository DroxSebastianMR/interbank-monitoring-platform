import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  RegistrationDocumentType,
  RegistrationStep,
  REGISTRATION_PREVIEW_STEPS,
  REGISTRATION_STEPS,
} from "@/src/domain/registration/registration.types";
import type {
  RegistrationDraft,
  RegistrationErrors,
} from "@/src/domain/registration/registration.types";
import { validateRegistrationStep } from "@/src/domain/registration/registration.validation";

const emptyDraft = (): RegistrationDraft => ({
  documentType: RegistrationDocumentType.DNI,
  documentNumber: "",
  privacyAccepted: false,
  email: "",
  phone: "",
  username: "",
  password: "",
  confirmPassword: "",
});

export function useRegistration() {
  const [draft, setDraft] = useState<RegistrationDraft>(emptyDraft);
  const [step, setStep] = useState(RegistrationStep.DOCUMENT);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [credentialsReviewed, setCredentialsReviewed] = useState(false);
  const complete = step === RegistrationStep.COMPLETE;
  const index = complete
    ? REGISTRATION_STEPS.length - 1
    : REGISTRATION_STEPS.findIndex((item) => item === step);
  const previewStep = REGISTRATION_PREVIEW_STEPS.includes(step);
  const valid =
    !complete &&
    (step !== RegistrationStep.REVIEW || credentialsReviewed) &&
    Object.keys(validateRegistrationStep(step, draft)).length === 0;

  const change = <K extends keyof RegistrationDraft>(
    field: K,
    value: RegistrationDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const touch = (field: keyof RegistrationDraft) =>
    setErrors((current) => ({
      ...current,
      [field]: validateRegistrationStep(step, draft)[field],
    }));
  const clearPasswords = useCallback(
    () =>
      setDraft((current) => ({
        ...current,
        password: "",
        confirmPassword: "",
      })),
    [],
  );
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "background") clearPasswords();
    });
    return () => listener.remove();
  }, [clearPasswords]);

  const next = () => {
    if (complete || previewStep) return;
    const result = validateRegistrationStep(step, draft);
    setErrors(result);
    if (Object.keys(result).length) return;
    if (step === RegistrationStep.REVIEW) {
      if (!credentialsReviewed) return;
      clearPasswords();
      setStep(RegistrationStep.COMPLETE);
      return;
    }
    if (step === RegistrationStep.SECURITY) {
      setCredentialsReviewed(true);
      clearPasswords();
    }
    setDraft((current) => ({ ...current, email: current.email.trim() }));
    setStep(REGISTRATION_STEPS[index + 1]);
  };

  const continuePreview = () => {
    if (!previewStep) return;
    setErrors({});
    setStep(REGISTRATION_STEPS[index + 1]);
  };

  const back = useCallback(() => {
    if (
      step === RegistrationStep.DOCUMENT ||
      step === RegistrationStep.COMPLETE
    )
      return false;
    setErrors({});
    clearPasswords();
    setCredentialsReviewed(false);
    const position = REGISTRATION_STEPS.findIndex((item) => item === step);
    setStep(REGISTRATION_STEPS[position - 1]);
    return true;
  }, [step, clearPasswords]);

  const edit = (target: RegistrationStep) => {
    if (
      step !== RegistrationStep.REVIEW ||
      ![
        RegistrationStep.DOCUMENT,
        RegistrationStep.CONTACT,
        RegistrationStep.SECURITY,
      ].includes(target)
    )
      return;
    clearPasswords();
    setCredentialsReviewed(false);
    setErrors({});
    setStep(target);
  };

  const clear = () => {
    setDraft(emptyDraft());
    setErrors({});
    setCredentialsReviewed(false);
    setStep(RegistrationStep.DOCUMENT);
  };

  return {
    draft,
    step,
    index,
    valid,
    complete,
    previewStep,
    errors,
    credentialsReviewed,
    change,
    touch,
    next,
    continuePreview,
    back,
    edit,
    clear,
    clearPasswords,
  };
}
