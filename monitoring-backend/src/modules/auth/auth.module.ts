import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';

import type { AuthConfig } from '@/config/authentication/auth-config.interface';
import { AuthController } from '@/modules/auth/controllers/auth.controller';
import { JwtAccessGuard } from '@/modules/auth/guards/jwt-access.guard';
import { PermissionsGuard } from '@/modules/auth/guards/permissions.guard';
import { AuthRepository } from '@/modules/auth/repositories/auth.repository';
import { AuthService } from '@/modules/auth/services/auth.service';
import { PasswordService } from '@/modules/auth/services/password.service';
import { TokenService } from '@/modules/auth/services/token.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.getOrThrow<AuthConfig>('auth');
        return {
          secret: config.jwtSecret,
          signOptions: { expiresIn: config.accessTokenTtlSeconds },
        };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    PasswordService,
    TokenService,
    JwtAccessGuard,
    PermissionsGuard,
  ],
  exports: [JwtModule, AuthRepository, PasswordService, JwtAccessGuard, PermissionsGuard],
})
export class AuthModule {}
