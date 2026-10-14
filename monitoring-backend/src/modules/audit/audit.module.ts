import { Module } from '@nestjs/common';
import { AuditController } from '@/modules/audit/controllers/audit.controller';
import { AuditService } from '@/modules/audit/services/audit.service';
import { AuthModule } from '@/modules/auth/auth.module';
@Module({ imports: [AuthModule], controllers: [AuditController], providers: [AuditService] })
export class AuditModule {}
