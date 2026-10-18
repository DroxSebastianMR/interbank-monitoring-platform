import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { InvalidSessionException } from '@/modules/auth/exceptions/authentication.exception';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { AuthPrincipalCacheService } from '@/modules/auth/services/auth-principal-cache.service';
import type {
  AccessTokenPayload,
  AuthenticatedRequest,
  EmployeePrincipal,
} from '@/modules/auth/types/auth.types';

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly repository: AuthRepository,
    private readonly principalCache: AuthPrincipalCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    request.user = await this.authenticate(
      typeof authorization === 'string' ? authorization : undefined,
    );
    return true;
  }

  async authenticate(authorization?: string, useCache = true): Promise<EmployeePrincipal> {
    const token = this.extractBearerToken(authorization);

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      if (!this.isAccessTokenPayload(payload)) throw new InvalidSessionException();

      const cached = useCache
        ? await this.principalCache.get(payload.sessionId, payload.sub)
        : null;
      const employee =
        cached ?? (await this.repository.findPrincipalBySession(payload.sessionId, payload.sub));
      if (!employee) throw new InvalidSessionException();

      // Never extend TTL on a cache hit: revocation must have a bounded stale window.
      if (!cached) await this.principalCache.set(payload.sessionId, employee);

      return { ...employee, sessionId: payload.sessionId };
    } catch (error) {
      if (error instanceof InvalidSessionException) throw error;
      throw new InvalidSessionException();
    }
  }

  private extractBearerToken(authorization?: string): string {
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new InvalidSessionException();
    return token;
  }

  private isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
    if (!value || typeof value !== 'object') return false;
    const payload = value as Partial<AccessTokenPayload>;
    return (
      typeof payload.sub === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.sessionId === 'string' &&
      payload.type === 'access'
    );
  }
}
