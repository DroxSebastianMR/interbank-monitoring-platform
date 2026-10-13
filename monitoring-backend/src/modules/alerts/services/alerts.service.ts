import { Injectable } from '@nestjs/common';
import { AlertsRepository } from '@/modules/alerts/repositories/alerts.repository';

@Injectable()
export class AlertsService {
  constructor(private readonly repository: AlertsRepository) {}

  findAll() {
    return this.repository.findRecent();
  }
}
