import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { isBankingAnalytics, type BankingAnalytics } from '@/modules/analytics/types/banking-analytics.type';

@Injectable()
export class BankingAnalyticsService {
  private cached?: { at: number; value: BankingAnalytics };
  private pending?: Promise<BankingAnalytics>;
  constructor(private readonly http: HttpService, private readonly config: ConfigService) {}
  snapshot(): Promise<BankingAnalytics> {
    if (this.cached && Date.now() - this.cached.at < 30000) return Promise.resolve(this.cached.value);
    if (this.pending) return this.pending;
    this.pending = this.collect().finally(() => { this.pending = undefined; });
    return this.pending;
  }
  private async collect(): Promise<BankingAnalytics> {
    const base = this.config.get<string>('BANK_ANALYTICS_URL');
    const token = this.config.get<string>('BANK_ANALYTICS_TOKEN', '');
    if (!base || token.length < 32) throw new ServiceUnavailableException('Banking analytics integration is not configured');
    try {
      const response = await firstValueFrom(this.http.get<unknown>(`${base.replace(/\/$/, '')}/internal/operational-analytics`, { headers: { 'X-Monitor-Token': token }, timeout: 4000, maxRedirects: 0, maxContentLength: 2 * 1024 * 1024 }));
      if (!isBankingAnalytics(response.data) || Date.now() - Date.parse(response.data.generatedAt) > 120000 || Date.parse(response.data.generatedAt) > Date.now() + 5000) throw new Error('Invalid or stale aggregates');
      this.cached = { at: Date.now(), value: response.data };
      return response.data;
    } catch { throw new ServiceUnavailableException('Banking analytics unavailable; no synthetic totals substituted'); }
  }
}
