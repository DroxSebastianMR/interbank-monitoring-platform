export type LoginMode = "FIRST_LOGIN" | "DEVICE_LOGIN" | "BIOMETRIC_LOGIN";

export type BiometricEnrollmentRequest = DeviceLoginRequest;

export interface BiometricCredentialRequest {
  credential: string;
  deviceId: string;
}

export interface BiometricCredentialResponse {
  credential: string;
  expiresIn: number;
}

export interface FirstLoginRequest {
  documentNumber: string;
  email: string;
  password: string;
  deviceId: string;
  deviceName?: string;
}

export interface DeviceLoginRequest {
  sessionToken: string;
  deviceId: string;
  password: string;
}

export interface AuthApiResponse {
  authenticated: true;
  loginMode: LoginMode;
  token: {
    accessToken: string;
    tokenType: "Bearer";
    expiresIn: number;
  };
  session: {
    sessionToken: string;
    expiresIn: number;
    deviceId: string;
  };
  user: {
    id: string;
    documentNumber: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}
