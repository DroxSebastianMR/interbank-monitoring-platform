import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

@Injectable()
export class AnalyticsTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('BANK_ANALYTICS_TOKEN', '');
    const supplied = context.switchToHttp().getRequest<Request>().headers['x-monitor-token'];
    if (expected.length < 32 || typeof supplied !== 'string' || supplied.length > 512) throw new UnauthorizedException();
    const a = Buffer.from(expected), b = Buffer.from(supplied);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException();
    return true;
  }
}
