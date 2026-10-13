import { randomBytes } from 'node:crypto';

// Explicit documentation-only boot. No real credentials or PostgreSQL connection are needed.
process.env.MONITORING_DOCS_ONLY = 'true';
process.env.DATABASE_URL ||= 'postgresql://docs:docs@127.0.0.1:5432/docs?schema=monitoring';
process.env.JWT_SECRET ||= randomBytes(32).toString('hex');

void import('./main').catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
