import { Controller, Delete, Get, Module, Post, Put, Patch, Head, Options } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import type { Server } from 'node:http';
import * as request from 'supertest';

import { httpMetricsRegistry, observeHttpRequest } from '@/modules/metrics/http-metrics';
import { observeEndpoint, registerEndpointCatalog } from '@/modules/metrics/endpoint-metrics';

@Controller('catalog-test')
class CatalogController {
  @Get(':id') get() {
    return { ok: true };
  }
  @Post() post() {
    return { ok: true };
  }
  @Put(':id') put() {
    return { ok: true };
  }
  @Patch(':id') patch() {
    return { ok: true };
  }
  @Delete(':id') delete() {
    return { ok: true };
  }
  @Head() head() {
    return;
  }
  @Options() options() {
    return;
  }
}
@Module({ controllers: [CatalogController] })
class CatalogModule {}

describe('Automatic operation metrics', () => {
  let app: INestApplication;
  let document: OpenAPIObject;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [CatalogModule] }).compile();
    app = module.createNestApplication();
    app.use(observeHttpRequest);
    document = SwaggerModule.createDocument(app, {
      openapi: '3.0.0',
      info: { title: 'test', version: '1' },
    });
    await app.init();
  });
  beforeEach(() => registerEndpointCatalog(document));
  afterAll(async () => app.close());

  it('discovers all declared methods before receiving traffic and initializes bounded counters', async () => {
    const metrics = await httpMetricsRegistry.metrics();
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']) {
      expect(metrics).toContain(`method="${method}"`);
    }
    expect(metrics).toContain('route="/catalog-test/{id}"');
    expect(metrics).toMatch(/interbank_app_endpoint_requests_total\{[^\n]+\} 0/);
  });

  it('uses the Express route template, never actual ids, query values or unknown URLs', async () => {
    await request(app.getHttpServer() as Server)
      .get('/catalog-test/private-account?token=private-token')
      .expect(200);
    await request(app.getHttpServer() as Server)
      .get('/unregistered-private-id')
      .expect(404);
    const metrics = await httpMetricsRegistry.metrics();
    expect(metrics).toMatch(
      /interbank_app_endpoint_requests_total\{[^\n]*method="GET",route="\/catalog-test\/\{id\}",status_class="2xx"\} 1/,
    );
    expect(metrics).not.toContain('private-account');
    expect(metrics).not.toContain('private-token');
    expect(metrics).not.toContain('unregistered-private-id');
  });

  it('ignores unmatched paths and replaces a removed operation at startup', async () => {
    observeEndpoint('GET', undefined, 200, 0.001);
    observeEndpoint('GET', '/unknown/private', 500, 0.1);
    registerEndpointCatalog({ ...document, paths: {} });
    expect(await httpMetricsRegistry.metrics()).not.toContain('route="/catalog-test/{id}"');
  });
});
