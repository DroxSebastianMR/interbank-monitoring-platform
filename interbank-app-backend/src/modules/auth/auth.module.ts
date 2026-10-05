import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import type { AuthConfig } from '@/config';
import { AuthController } from '@/modules/auth/controllers/auth.controller';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { AuthSessionCacheService } from '@/modules/auth/services/auth-session-cache.service';
import { CredentialProofService } from '@/modules/auth/services/credential-proof.service';
import { AuthService } from '@/modules/auth/services/auth.service';
import { LoginService } from '@/modules/auth/services/login.service';
import { PasswordService } from '@/modules/auth/services/password.service';
import { TokenService } from '@/modules/auth/services/token.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const authConfig = configService.getOrThrow<AuthConfig>('auth');
        return {
          secret: authConfig.jwtSecret,
          signOptions: { expiresIn: authConfig.accessTokenTtlSeconds },
        };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LoginService,
    AuthRepository,
    PasswordService,
    TokenService,
    AuthSessionCacheService,
    CredentialProofService,
    JwtAccessGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [JwtModule, JwtAccessGuard],
})
export class AuthModule {}
