import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class HealthService {
  constructor(private readonly config: ConfigService) {}
  check() {
    return {
      status: 'ok',
      service: 'interbank-app-backend',
      instance: this.config.get<string>('app.instanceName', 'unknown'),
      timestamp: new Date().toISOString(),
    };
  }
}
