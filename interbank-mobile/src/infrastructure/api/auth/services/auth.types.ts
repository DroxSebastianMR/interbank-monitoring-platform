export type LoginMode = "FIRST_LOGIN" | "DEVICE_LOGIN";

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
