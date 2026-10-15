export enum BiometricKind {
  FACE_ID = "FACE_ID",
  FINGERPRINT = "FINGERPRINT",
  NONE = "NONE",
}

export enum BiometricFailure {
  UNAVAILABLE = "BIOMETRIC_UNAVAILABLE",
  CANCELED = "BIOMETRIC_CANCELED",
  INVALIDATED = "BIOMETRIC_INVALIDATED",
  FAILED = "BIOMETRIC_FAILED",
}

export interface BiometricCapability {
  kind: BiometricKind;
  available: boolean;
}

export class BiometricAuthError extends Error {
  constructor(public readonly code: BiometricFailure) {
    super(code);
    this.name = "BiometricAuthError";
  }
}
