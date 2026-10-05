export const AUTH_LIMITS = {
  loginRequestsPerMinute: 5,
  passwordMinLength: 8,
  passwordMaxLength: 72,
  deviceIdMinLength: 16,
  deviceIdMaxLength: 128,
} as const;

export const DNI_PATTERN = /^\d{8}$/;
export const AUTH_SESSION_CACHE_PREFIX = 'auth:session:';
export const PASSWORD_HASH_ROUNDS = 12;
export const DUMMY_PASSWORD_HASH = '$2b$12$j1OamTaYmXWgquu3q9BQlupkvyIC/ttO3.HggwikMOsEOurThYUya';
export const INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas';
