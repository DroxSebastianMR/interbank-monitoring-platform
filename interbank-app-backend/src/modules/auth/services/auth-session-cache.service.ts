import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';

import { CacheStoreService } from '@/common/cache/cache-store.service';
import type { AuthConfig } from '@/config';
import { AUTH_SESSION_CACHE_PREFIX } from '@/modules/auth/constants/auth.constants';
import type {
  AuthUserProfile,
  CachedAuthSession,
  IssuedSession,
} from '@/modules/auth/types/auth.types';

@Injectable()
export class AuthSessionCacheService {
  private readonly authConfig: AuthConfig;

  constructor(
    configService: ConfigService,
    private readonly cache: CacheStoreService,
  ) {
    this.authConfig = configService.getOrThrow<AuthConfig>('auth');
  }

  async create(
    user: AuthUserProfile,
    credentialProof: string,
    deviceId: string,
    deviceName?: string,
  ): Promise<IssuedSession> {
    const token = randomBytes(32).toString('base64url');
    const now = Date.now();
    const value: CachedAuthSession = {
      user,
      credentialProof,
      deviceId,
      ...(deviceName ? { deviceName } : {}),
      createdAt: now,
      expiresAt: now + this.authConfig.sessionTtlSeconds * 1000,
    };

    await this.set(token, value);

    return {
      id: this.hashToken(token).slice(0, 16),
      token,
      expiresIn: this.authConfig.sessionTtlSeconds,
      value,
    };
  }

  async find(token: string): Promise<CachedAuthSession | null> {
    const key = this.toKey(token);
    const cached = await this.cache.get(key);
    if (!cached) return null;

    const value = JSON.parse(cached) as CachedAuthSession;
    if (value.expiresAt <= Date.now()) {
      await this.delete(token);
      return null;
    }

    return value;
  }

  async rotate(token: string, session: CachedAuthSession): Promise<IssuedSession> {
    await this.delete(token);
    return this.create(session.user, session.credentialProof, session.deviceId, session.deviceName);
  }

  async delete(token: string): Promise<void> {
    const key = this.toKey(token);
    await this.cache.delete(key);
  }

  private async set(token: string, value: CachedAuthSession): Promise<void> {
    const key = this.toKey(token);
    await this.cache.set(key, JSON.stringify(value), this.authConfig.sessionTtlSeconds);
  }

  private toKey(token: string): string {
    return `${AUTH_SESSION_CACHE_PREFIX}${this.hashToken(token)}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
