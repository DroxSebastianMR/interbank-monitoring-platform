export enum RegistrationStep {
  DOCUMENT = "DOCUMENT",
  CONTACT = "CONTACT",
  VERIFICATION = "VERIFICATION",
  IDENTITY = "IDENTITY",
  SECURITY = "SECURITY",
  REVIEW = "REVIEW",
  COMPLETE = "COMPLETE",
}

export enum RegistrationDocumentType {
  DNI = "DNI",
}

export interface RegistrationDraft {
  documentType: RegistrationDocumentType;
  documentNumber: string;
  privacyAccepted: boolean;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export type RegistrationErrors = Partial<
  Record<keyof RegistrationDraft, string>
>;

export const REGISTRATION_STEPS = [
  RegistrationStep.DOCUMENT,
  RegistrationStep.CONTACT,
  RegistrationStep.VERIFICATION,
  RegistrationStep.IDENTITY,
  RegistrationStep.SECURITY,
  RegistrationStep.REVIEW,
] as const;

// UI-only transitions never authorize registration, OTP validation or identity verification.
export const REGISTRATION_PREVIEW_STEPS: readonly RegistrationStep[] = [
  RegistrationStep.VERIFICATION,
  RegistrationStep.IDENTITY,
];
