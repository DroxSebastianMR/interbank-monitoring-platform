export interface AuthConfig {
  jwtSecret: string;
  sessionPepper: string;
  accessTokenTtlSeconds: number;
  sessionTtlSeconds: number;
}
