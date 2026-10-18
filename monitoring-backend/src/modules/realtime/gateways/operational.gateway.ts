import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnGatewayInit, WebSocketGateway } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import type { Subscription } from 'rxjs';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { OperationalChannel } from '@/modules/realtime/enums/operational-event.enum';
import { OperationalEventsService } from '@/modules/realtime/services/operational-events.service';

const CHANNEL_PERMISSIONS: Record<OperationalChannel, string> = {
  endpoints: 'analytics.read',
  incidents: 'incidents.read',
};

@WebSocketGateway({ namespace: '/operations', transports: ['websocket'], maxHttpBufferSize: 8192 })
export class OperationalGateway implements OnGatewayInit, OnModuleDestroy {
  private subscription?: Subscription;
  private timer?: NodeJS.Timeout;
  private readonly sessions = new Map<
    string,
    { socket: Socket; authorization: string; permissions: string[]; checkedAt: number }
  >();
  private broadcasting: Promise<void> = Promise.resolve();
  private pending = 0;
  private validation?: Promise<void>;
  constructor(
    private readonly auth: JwtAccessGuard,
    private readonly config: ConfigService,
    private readonly events: OperationalEventsService,
  ) {}

  afterInit(namespace: Namespace): void {
    namespace.use((socket, next) => {
      void this.authorize(socket)
        .then((session) => {
          if (this.sessions.size >= 200) throw new Error('Connection limit');
          this.sessions.set(socket.id, session);
          // A failed handshake does not emit disconnect; expire unattached entries too.
          const cleanup = setTimeout(() => {
            if (!namespace.sockets.has(socket.id)) this.sessions.delete(socket.id);
          }, 10_000);
          cleanup.unref();
          next();
        })
        .catch(() => next(new Error('Unauthorized operational connection')));
    });
    namespace.on('connection', (socket: Socket) => {
      socket.emit('ready', { schemaVersion: 1, streamId: this.events.streamId });
      socket.on('disconnect', () => this.sessions.delete(socket.id));
    });
    this.subscription = this.events.events.subscribe((event) => {
      if (this.pending >= 4) {
        for (const session of this.sessions.values()) session.socket.disconnect(true);
        return; // Reconnection requires an HTTP snapshot; never grow an unbounded send queue.
      }
      this.pending++;
      this.broadcasting = this.broadcasting
        .then(async () => {
          await this.revalidate();
          for (const session of this.sessions.values()) {
            if (
              session.socket.connected &&
              session.permissions.includes(CHANNEL_PERMISSIONS[event.channel])
            ) {
              session.socket.volatile.emit('operational.event', event);
            }
          }
        })
        .catch(() => undefined)
        .finally(() => {
          this.pending--;
        });
    });
    this.timer = setInterval(() => {
      void this.revalidate();
    }, 15_000);
    this.timer.unref();
  }

  private async authorize(socket: Socket) {
    if (this.config.get<boolean>('app.docsOnly', false)) throw new Error('Docs mode');
    const origins = this.config.get<string[]>('app.corsOrigins', []);
    const origin = socket.handshake.headers.origin;
    if (!origin || !origins.includes(origin)) throw new Error('Origin denied');
    const token: unknown = socket.handshake.auth?.token;
    if (typeof token !== 'string' || token.length > 4096) throw new Error('Invalid token');
    const authorization = `Bearer ${token}`;
    const principal = await this.auth.authenticate(authorization, false);
    if (
      !Object.values(CHANNEL_PERMISSIONS).some((permission) =>
        principal.permissions.includes(permission),
      )
    )
      throw new Error('Access denied');
    return { socket, authorization, permissions: principal.permissions, checkedAt: Date.now() };
  }

  private revalidate(): Promise<void> {
    if (this.validation) return this.validation;
    this.validation = this.validateSessions().finally(() => { this.validation = undefined; });
    return this.validation;
  }

  private async validateSessions(): Promise<void> {
    // Bound concurrent DB/cache work; expiration/revocation is rechecked even on an idle connection.
    for (const session of this.sessions.values()) {
      if (Date.now() - session.checkedAt < 15_000) continue;
      try {
        const principal = await this.auth.authenticate(session.authorization, false);
        session.permissions = principal.permissions;
        session.checkedAt = Date.now();
      } catch {
        this.sessions.delete(session.socket.id);
        session.socket.disconnect(true);
      }
    }
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
    if (this.timer) clearInterval(this.timer);
    for (const session of this.sessions.values()) session.socket.disconnect(true);
    this.sessions.clear();
  }
}
