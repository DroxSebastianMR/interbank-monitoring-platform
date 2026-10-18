import { Injectable } from '@nestjs/common';

import type { EmployeeAccessProfile } from '@/modules/auth/types/auth.types';
import { RedisService } from '@/redis/redis.service';

const PRINCIPAL_CACHE_TTL_SECONDS = 30;
const EMPLOYEE_SESSION_INDEX_TTL_SECONDS = 24 * 60 * 60;
const PRINCIPAL_KEY_PREFIX = 'monitoring:auth:principal:v1:';
const EMPLOYEE_INDEX_PREFIX = 'monitoring:auth:employee-sessions:v1:';

@Injectable()
export class AuthPrincipalCacheService {
  constructor(private readonly redis: RedisService) {}

  async get(sessionId: string, employeeId: string): Promise<EmployeeAccessProfile | null> {
    try {
      const cached = await this.redis.client.get(this.principalKey(sessionId));
      if (!cached) return null;
      const value: unknown = JSON.parse(cached);
      return this.isProfile(value) && value.id === employeeId ? value : null;
    } catch {
      return null;
    }
  }

  async set(sessionId: string, profile: EmployeeAccessProfile): Promise<void> {
    try {
      const indexKey = this.employeeIndexKey(profile.id);
      await this.redis.client
        .multi()
        .set(
          this.principalKey(sessionId),
          JSON.stringify(profile),
          'EX',
          PRINCIPAL_CACHE_TTL_SECONDS,
        )
        .sadd(indexKey, sessionId)
        .expire(indexKey, EMPLOYEE_SESSION_INDEX_TTL_SECONDS)
        .exec();
    } catch {
      // Redis only removes repeated PostgreSQL authorization reads.
    }
  }

  async invalidateSession(sessionId: string, employeeId: string): Promise<void> {
    try {
      await this.redis.client
        .multi()
        .del(this.principalKey(sessionId))
        .srem(this.employeeIndexKey(employeeId), sessionId)
        .exec();
    } catch {
      // The database remains authoritative when Redis is unavailable.
    }
  }

  async invalidateEmployee(employeeId: string): Promise<void> {
    try {
      const indexKey = this.employeeIndexKey(employeeId);
      const sessionIds = await this.redis.client.smembers(indexKey);
      const keys = sessionIds.map((sessionId) => this.principalKey(sessionId));
      if (keys.length > 0) await this.redis.client.del(...keys);
      await this.redis.client.del(indexKey);
    } catch {
      // Cached principals expire after 30 seconds even if invalidation fails.
    }
  }

  private principalKey(sessionId: string): string {
    return `${PRINCIPAL_KEY_PREFIX}${sessionId}`;
  }

  private employeeIndexKey(employeeId: string): string {
    return `${EMPLOYEE_INDEX_PREFIX}${employeeId}`;
  }

  private isProfile(value: unknown): value is EmployeeAccessProfile {
    if (!value || typeof value !== 'object') return false;
    const profile = value as Partial<EmployeeAccessProfile>;
    return (
      typeof profile.id === 'string' &&
      typeof profile.employeeCode === 'string' &&
      typeof profile.corporateEmail === 'string' &&
      typeof profile.firstName === 'string' &&
      typeof profile.lastName === 'string' &&
      Array.isArray(profile.roles) &&
      profile.roles.every((role) => typeof role === 'string') &&
      Array.isArray(profile.permissions) &&
      profile.permissions.every((permission) => typeof permission === 'string')
    );
  }
}
