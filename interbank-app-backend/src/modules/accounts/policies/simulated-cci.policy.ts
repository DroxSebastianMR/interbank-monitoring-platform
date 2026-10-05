import { createHash } from 'node:crypto';

/** Simulation identifier only. Never use this algorithm to issue a real banking CCI. */
export class SimulatedCciPolicy {
  static generate(accountId: string): string {
    const normalized = accountId.toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(normalized)) {
      throw new Error('A UUID account ID is required to generate a simulated CCI');
    }
    const digest = createHash('md5').update(normalized).digest('hex').slice(0, 14);
    return `003${BigInt(`0x${digest}`).toString().padStart(17, '0')}`;
  }
}
