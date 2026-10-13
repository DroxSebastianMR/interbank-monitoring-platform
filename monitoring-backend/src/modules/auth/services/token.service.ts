import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';

import type { AuthConfig } from '@/config/auth.config';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';

@Injectable()
export class TokenService {
  private readonly config: AuthConfig;

  constructor(
    private readonly jwt: JwtService,
    configService: ConfigService,
  ) {
    this.config = configService.getOrThrow<AuthConfig>('auth');
  }

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.config.jwtSecret,
      expiresIn: this.config.accessTokenTtlSeconds,
    });
  }

  createRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  get accessTokenTtlSeconds(): number {
    return this.config.accessTokenTtlSeconds;
  }

  get refreshTokenTtlSeconds(): number {
    return this.config.refreshTokenTtlSeconds;
  }
}
