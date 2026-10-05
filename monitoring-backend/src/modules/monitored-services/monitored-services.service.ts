import { Injectable } from '@nestjs/common';
import { ServiceSnapshot, ServiceStatus } from '../service-state/interfaces/service-state';
@Injectable()
export class MonitoredServicesService {
  private readonly services: ServiceSnapshot[] = [
    {
      id: 'login',
      name: 'Login',
      path: '/auth/health',
      status: ServiceStatus.RECOVERING,
      lastCheckedAt: null,
      latencyMs: null,
      consecutiveFailures: 0,
      message: 'Awaiting first check',
    },
    {
      id: 'balance',
      name: 'Balance',
      path: '/accounts/health',
      status: ServiceStatus.RECOVERING,
      lastCheckedAt: null,
      latencyMs: null,
      consecutiveFailures: 0,
      message: 'Awaiting first check',
    },
    {
      id: 'transfers',
      name: 'Transfers',
      path: '/transfers/health',
      status: ServiceStatus.RECOVERING,
      lastCheckedAt: null,
      latencyMs: null,
      consecutiveFailures: 0,
      message: 'Awaiting first check',
    },
  ];
  findAll() {
    return this.services;
  }
  find(id: string) {
    return this.services.find((s) => s.id === id);
  }
  update(id: string, change: Partial<ServiceSnapshot>) {
    const item = this.find(id);
    if (item) Object.assign(item, change);
    return item;
  }
}
