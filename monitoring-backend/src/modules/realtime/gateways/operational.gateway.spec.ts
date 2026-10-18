import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { io, type Socket } from 'socket.io-client';
import { OperationalGateway } from '@/modules/realtime/gateways/operational.gateway';
import { OperationalEventsService } from '@/modules/realtime/services/operational-events.service';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import {
  OperationalChannel,
  OperationalEventType,
} from '@/modules/realtime/enums/operational-event.enum';

describe('Operational WebSocket integration', () => {
  let app: INestApplication;
  let base: string;
  let events: OperationalEventsService;
  const sockets: Socket[] = [];
  const authenticate = jest.fn((token: string) => {
    if (token === 'Bearer analytics') return Promise.resolve({ permissions: ['analytics.read'] });
    if (token === 'Bearer incidents') return Promise.resolve({ permissions: ['incidents.read'] });
    if (token === 'Bearer basic') return Promise.resolve({ permissions: ['dashboard.read'] });
    return Promise.reject(new Error('Invalid session'));
  });
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OperationalGateway,
        OperationalEventsService,
        { provide: JwtAccessGuard, useValue: { authenticate } },
        {
          provide: ConfigService,
          useValue: new ConfigService({ app: { corsOrigins: ['http://localhost:5173'] } }),
        },
      ],
    }).compile();
    app = module.createNestApplication();
    events = module.get(OperationalEventsService);
    await app.listen(0, '127.0.0.1');
    const address = (app.getHttpServer() as Server).address() as AddressInfo;
    base = `http://127.0.0.1:${address.port}/operations`;
  });
  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
  });
  afterAll(async () => {
    await app.close();
  });
  const connect = (token: string, origin = 'http://localhost:5173') => {
    const socket = io(base, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false,
      auth: { token },
      extraHeaders: { origin },
    });
    sockets.push(socket);
    return socket;
  };
  const wait = (socket: Socket, name: string): Promise<unknown> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`No ${name}`)), 2500);
      socket.once(name, (data: unknown) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  it.each([
    ['invalid', 'http://localhost:5173'],
    ['basic', 'http://localhost:5173'],
    ['analytics', 'https://untrusted.example'],
  ])('denies token %s and origin %s', async (token, origin) => {
    const socket = connect(token, origin);
    const response = wait(socket, 'connect_error');
    socket.connect();
    expect(await response).toBeInstanceOf(Error);
    expect(socket.connected).toBe(false);
  });
  it('delivers versioned events only to the permitted channel and provides a new ready cursor on reconnect', async () => {
    const analytics = connect('analytics'),
      incidents = connect('incidents');
    const readyA = wait(analytics, 'ready'),
      readyI = wait(incidents, 'ready');
    analytics.connect();
    incidents.connect();
    await Promise.all([readyA, readyI]);
    const receivedAnalytics: unknown[] = [];
    analytics.on('operational.event', (data: unknown) => receivedAnalytics.push(data));
    const received = wait(incidents, 'operational.event');
    const event = events.publish(
      OperationalChannel.INCIDENTS,
      OperationalEventType.INCIDENT_CREATED,
      { incidentId: 'test' },
    );
    expect(await received).toEqual(event);
    expect(receivedAnalytics).toHaveLength(0);
    expect(event).toMatchObject({ schemaVersion: 1, sequence: 1 });
    analytics.disconnect();
    const readyAgain = wait(analytics, 'ready');
    analytics.connect();
    expect(await readyAgain).toEqual({ schemaVersion: 1, streamId: events.streamId });
  });
});
