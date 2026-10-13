import { Controller, Get, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { MetricsModule } from '@/modules/metrics/metrics.module';

@Controller('probe')
class ProbeController {
  @Get()
  ok(): { status: string } {
    return { status: 'ok' };
  }
}

@Module({ imports: [MetricsModule], controllers: [ProbeController] })
class ProbeModule {}

describe('MetricsModule HTTP integration', () => {
  it('records a real HTTP response and serves the Prometheus exposition', async () => {
    const module = await Test.createTestingModule({ imports: [ProbeModule] }).compile();
    const app = module.createNestApplication();
    try {
      await app.init();
      const server = app.getHttpServer() as Parameters<typeof request>[0];
      await request(server).get('/probe').expect(200);
      const response = await request(server).get('/metrics').expect(200);
      expect(response.text).toContain('monitoring_backend_up 1');
      expect(response.text).toContain('route="/other",status_code="200"} 1');
      expect(response.text).toContain('monitoring_backend_http_request_duration_seconds_count');
    } finally {
      await app.close();
    }
  });
});
