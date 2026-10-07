import { Module } from '@nestjs/common';
import { AuditController } from '@/modules/audit/audit.controller';
import { AuditService } from '@/modules/audit/audit.service';
@Module({ controllers: [AuditController], providers: [AuditService] })
export class AuditModule {}
