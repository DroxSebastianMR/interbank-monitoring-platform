import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';

type AuthenticatedRequest = Request & { user?: AccessTokenPayload };

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
      if (!this.isAccessTokenPayload(payload)) throw new UnauthorizedException();
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Token de acceso inválido o expirado');
    }
  }

  private extractBearerToken(authorization?: string): string {
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Token de acceso requerido');
    return token;
  }

  private isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
    if (!value || typeof value !== 'object') return false;
    const payload = value as Partial<AccessTokenPayload>;
    return (
      typeof payload.sub === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.sessionId === 'string'
    );
  }
}
