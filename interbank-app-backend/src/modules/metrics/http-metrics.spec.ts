import { EventEmitter } from 'node:events';
import type { Request, Response } from 'express';
import {
  httpMetricsRegistry,
  logicalService,
  observeHttpRequest,
} from '@/modules/metrics/http-metrics';

describe('logicalService', () => {
  it('uses bounded labels rather than request identifiers or query strings', () => {
    expect(logicalService('/accounts/123?secret=ignored')).toBe('accounts');
    expect(logicalService('/some-dynamic-id/123')).toBe('other');
  });

  it('exposes completed requests in Prometheus format without path identifiers', async () => {
    const response = new EventEmitter() as Response;
    response.statusCode = 503;
    const next = jest.fn();
    observeHttpRequest({ path: '/transfers/private-id' } as Request, response, next);
    response.emit('finish');
    const metrics = await httpMetricsRegistry.metrics();
    expect(next).toHaveBeenCalledTimes(1);
    expect(metrics).toContain(
      'interbank_app_http_requests_total{service="transfers",status_code="503"}',
    );
    expect(metrics).not.toContain('private-id');
  });
});
