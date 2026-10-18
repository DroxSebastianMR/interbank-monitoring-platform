import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { InvalidSessionException } from '@/modules/auth/exceptions/authentication.exception';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { AuthPrincipalCacheService } from '@/modules/auth/services/auth-principal-cache.service';
import type { AccessTokenPayload, AuthenticatedRequest } from '@/modules/auth/types/auth.types';

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
    const token = this.extractBearerToken(
      typeof authorization === 'string' ? authorization : undefined,
    );

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      if (!this.isAccessTokenPayload(payload)) throw new InvalidSessionException();

      const employee =
        (await this.principalCache.get(payload.sessionId, payload.sub)) ??
        (await this.repository.findPrincipalBySession(payload.sessionId, payload.sub));
      if (!employee) throw new InvalidSessionException();

      await this.principalCache.set(payload.sessionId, employee);

      request.user = { ...employee, sessionId: payload.sessionId };
      return true;
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
