import { buildCorsOptions, parseCorsOrigins } from '@/config/cors.config';

describe('CORS configuration', () => {
  it('parses and trims a comma-separated allowlist', () => {
    expect(parseCorsOrigins('http://localhost:5173, https://dashboard.example.com')).toEqual([
      'http://localhost:5173',
      'https://dashboard.example.com',
    ]);
  });

  it('disables credentials when every origin is allowed', () => {
    expect(buildCorsOptions(['*'])).toMatchObject({ origin: true, credentials: false });
  });
});
