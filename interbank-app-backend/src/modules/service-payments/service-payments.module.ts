import { Module } from '@nestjs/common';

import { AuthModule } from '@/modules/auth/auth.module';
import { HomeModule } from '@/modules/home/home.module';
import { ServicePaymentsController } from '@/modules/service-payments/controllers/service-payments.controller';
import { SavedServicePaymentRepository } from '@/modules/service-payments/repositories/saved-service-payment.repository';
import { ServiceCatalogRepository } from '@/modules/service-payments/repositories/service-catalog.repository';
import { ServiceDebtsRepository } from '@/modules/service-payments/repositories/service-debts.repository';
import { ServicePaymentCommandRepository } from '@/modules/service-payments/repositories/service-payment-command.repository';
import { ServicePaymentQueryRepository } from '@/modules/service-payments/repositories/service-payment-query.repository';
import { SavedServicePaymentService } from '@/modules/service-payments/services/saved-service-payment.service';
import { ServiceAgreementResolverService } from '@/modules/service-payments/services/service-agreement-resolver.service';
import { ServiceCatalogService } from '@/modules/service-payments/services/service-catalog.service';
import { ServiceDebtInquiryService } from '@/modules/service-payments/services/service-debt-inquiry.service';
import { ServicePaymentExecutionService } from '@/modules/service-payments/services/service-payment-execution.service';
import { ServicePaymentQueryService } from '@/modules/service-payments/services/service-payment-query.service';
import { ServicePaymentsCacheService } from '@/modules/service-payments/services/service-payments-cache.service';
import { ServiceReferenceValidatorService } from '@/modules/service-payments/services/service-reference-validator.service';

@Module({
  imports: [AuthModule, HomeModule],
  controllers: [ServicePaymentsController],
  providers: [
    ServiceCatalogRepository,
    ServiceDebtsRepository,
    ServicePaymentCommandRepository,
    ServicePaymentQueryRepository,
    SavedServicePaymentRepository,
    ServiceCatalogService,
    ServiceDebtInquiryService,
    ServicePaymentExecutionService,
    ServicePaymentQueryService,
    SavedServicePaymentService,
    ServiceAgreementResolverService,
    ServiceReferenceValidatorService,
    ServicePaymentsCacheService,
  ],
})
export class ServicePaymentsModule {}
