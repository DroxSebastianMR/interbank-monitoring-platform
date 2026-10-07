import { buildCorsOptions, parseCorsOrigins } from '@/config/cors/cors.config';

describe('CORS configuration', () => {
  it('parses and trims a comma-separated allowlist', () => {
    expect(parseCorsOrigins('http://localhost:5173, http://localhost:8081')).toEqual([
      'http://localhost:5173',
      'http://localhost:8081',
    ]);
  });

  it('disables credentials when every origin is allowed', () => {
    expect(buildCorsOptions(['*'])).toMatchObject({ origin: true, credentials: false });
  });

  it('allows the headers sent by the mobile and web clients', () => {
    expect(buildCorsOptions(['http://localhost:8081']).allowedHeaders).toEqual(
      expect.arrayContaining(['X-Platform', 'X-App-Version']),
    );
  });
});
