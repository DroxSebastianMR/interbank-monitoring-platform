import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { CacheStoreService } from '@/common/cache/cache-store.service';
import {
  SERVICE_PAYMENT_CATALOG_CACHE_PREFIX,
  SERVICE_PAYMENT_CATALOG_CACHE_TTL_SECONDS,
  SERVICE_PAYMENT_DEBT_CACHE_TTL_SECONDS,
  SERVICE_PAYMENT_IDEMPOTENCY_CACHE_TTL_SECONDS,
} from '@/modules/service-payments/constants/service-payment.constants';

@Injectable()
export class ServicePaymentsCacheService {
  constructor(private readonly cache: CacheStoreService) {}

  categories<T>(): Promise<T | null> {
    return this.get<T>('categories');
  }

  setCategories<T>(value: T): Promise<void> {
    return this.set('categories', value, SERVICE_PAYMENT_CATALOG_CACHE_TTL_SECONDS);
  }

  providers<T>(category?: string, search?: string, limit?: number): Promise<T | null> {
    return this.get<T>(this.catalogKey('providers', category, search, limit));
  }

  setProviders<T>(
    category: string | undefined,
    search: string | undefined,
    limit: number,
    value: T,
  ) {
    return this.set(
      this.catalogKey('providers', category, search, limit),
      value,
      SERVICE_PAYMENT_CATALOG_CACHE_TTL_SECONDS,
    );
  }

  debts<T>(serviceCode: string, customerReference: string): Promise<T | null> {
    return this.get<T>(this.debtKey(serviceCode, customerReference));
  }

  setDebts<T>(serviceCode: string, customerReference: string, value: T): Promise<void> {
    return this.set(
      this.debtKey(serviceCode, customerReference),
      value,
      SERVICE_PAYMENT_DEBT_CACHE_TTL_SECONDS,
    );
  }

  invalidateDebts(serviceCode: string, customerReference: string): Promise<void> {
    return this.cache.delete(this.fullKey(this.debtKey(serviceCode, customerReference)));
  }

  idempotentPayment<T>(userId: string, idempotencyKey: string): Promise<T | null> {
    return this.get<T>(this.idempotencyKey(userId, idempotencyKey));
  }

  setIdempotentPayment<T>(userId: string, idempotencyKey: string, value: T): Promise<void> {
    return this.set(
      this.idempotencyKey(userId, idempotencyKey),
      value,
      SERVICE_PAYMENT_IDEMPOTENCY_CACHE_TTL_SECONDS,
    );
  }

  private async get<T>(key: string): Promise<T | null> {
    const value = await this.cache.get(this.fullKey(key));
    return value ? (JSON.parse(value) as T) : null;
  }

  private set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    return this.cache.set(this.fullKey(key), JSON.stringify(value), ttlSeconds);
  }

  private catalogKey(resource: string, category?: string, search?: string, limit?: number): string {
    return `${resource}:${this.hash(`${category ?? ''}|${search ?? ''}|${limit ?? ''}`)}`;
  }

  private debtKey(serviceCode: string, customerReference: string): string {
    return `debts:${this.hash(`${serviceCode}|${customerReference}`)}`;
  }

  private idempotencyKey(userId: string, idempotencyKey: string): string {
    return `idempotency:${this.hash(`${userId}|${idempotencyKey}`)}`;
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private fullKey(key: string): string {
    return `${SERVICE_PAYMENT_CATALOG_CACHE_PREFIX}${key}`;
  }
}
