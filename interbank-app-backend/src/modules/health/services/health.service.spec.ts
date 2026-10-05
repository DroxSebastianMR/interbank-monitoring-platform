import { ConfigService } from '@nestjs/config';

import { HealthService } from '@/modules/health/services/health.service';
describe('HealthService', () => {
  it('returns instance health', () => {
    const service = new HealthService(new ConfigService({ app: { instanceName: 'test-1' } }));
    expect(service.check()).toMatchObject({ status: 'ok', instance: 'test-1' });
  });
});
