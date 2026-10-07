export const AUTH_LIMITS = {
  loginRequestsPerMinute: 5,
  refreshRequestsPerMinute: 20,
  passwordMinLength: 12,
  passwordMaxLength: 128,
} as const;

export const DUMMY_PASSWORD_HASH = [
  'scrypt',
  '16384',
  '8',
  '1',
  'ZHVtbXktc2FsdC1mb3ItdGltaW5n',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
].join('$');

export const REQUIRED_PERMISSIONS_KEY = 'required-permissions';
