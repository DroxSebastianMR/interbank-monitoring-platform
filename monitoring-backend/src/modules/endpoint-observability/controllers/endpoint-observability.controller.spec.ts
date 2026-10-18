import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import * as request from 'supertest';

import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { AuthPrincipalCacheService } from '@/modules/auth/services/auth-principal-cache.service';
import { EndpointObservabilityController } from '@/modules/endpoint-observability/controllers/endpoint-observability.controller';
import { EndpointObservabilityService } from '@/modules/endpoint-observability/services/endpoint-observability.service';

describe('Endpoint catalog authorization (HTTP)', () => {
  let app: INestApplication;
  const jwt = new JwtService({ secret: 'test-only-endpoint-observability-secret' });
  const snapshot = jest
    .fn()
    .mockResolvedValue({ endpoints: [], instances: [], sourceState: 'AVAILABLE' });
  const findPrincipalBySession = jest.fn();
  const token = jwt.sign({
    sub: 'employee',
    email: 'employee@example.test',
    sessionId: 'session',
    type: 'access',
  });
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [EndpointObservabilityController],
      providers: [
        JwtAccessGuard,
        PermissionsGuard,
        { provide: JwtService, useValue: jwt },
        { provide: AuthRepository, useValue: { findPrincipalBySession } },
        {
          provide: AuthPrincipalCacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
          },
        },
        { provide: EndpointObservabilityService, useValue: { snapshot } },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterAll(async () => app.close());

  it('rejects anonymous requests before any Prometheus access', async () => {
    await request(app.getHttpServer() as Server)
      .get('/endpoint-observability')
      .expect(401);
    expect(snapshot).not.toHaveBeenCalled();
  });
  it('rejects authenticated users without analytics.read', async () => {
    findPrincipalBySession.mockResolvedValue({ id: 'employee', permissions: ['dashboard.read'] });
    await request(app.getHttpServer() as Server)
      .get('/endpoint-observability')
      .auth(token, { type: 'bearer' })
      .expect(403);
    expect(snapshot).not.toHaveBeenCalled();
  });
  it('rejects a revoked session even with a signed token', async () => {
    findPrincipalBySession.mockResolvedValue(null);
    await request(app.getHttpServer() as Server)
      .get('/endpoint-observability')
      .auth(token, { type: 'bearer' })
      .expect(401);
    expect(snapshot).not.toHaveBeenCalled();
  });
  it('allows analytics.read and prevents HTTP caching of the protected response', async () => {
    findPrincipalBySession.mockResolvedValue({ id: 'employee', permissions: ['analytics.read'] });
    await request(app.getHttpServer() as Server)
      .get('/endpoint-observability')
      .auth(token, { type: 'bearer' })
      .expect(200)
      .expect('Cache-Control', 'no-store');
    expect(snapshot).toHaveBeenCalledTimes(1);
  });
});
