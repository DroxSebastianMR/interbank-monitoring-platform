import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { AuthConfig } from '@/config';
import type { AccessTokenPayload } from '@/modules/auth/types/auth.types';

@Injectable()
export class TokenService {
  private readonly authConfig: AuthConfig;

  constructor(
    private readonly jwt: JwtService,
    configService: ConfigService,
  ) {
    this.authConfig = configService.getOrThrow<AuthConfig>('auth');
  }

  signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload, {
      secret: this.authConfig.jwtSecret,
      expiresIn: this.authConfig.accessTokenTtlSeconds,
    });
  }

  get accessTokenTtlSeconds(): number {
    return this.authConfig.accessTokenTtlSeconds;
  }
}
