import type { Type } from '@nestjs/common';
import { OperationalAnalyticsModule } from '@/modules/operational-analytics';

import { FEATURE_MODULES_ACCOUNTS } from '@/modules/accounts';
import { FEATURE_MODULES_AUTH } from '@/modules/auth';
import { FEATURE_MODULES_HEALTH } from '@/modules/health';
import { FEATURE_MODULES_HOME } from '@/modules/home';
import { MetricsModule } from '@/modules/metrics/metrics.module';
import { FEATURE_MODULES_SERVICE_PAYMENTS } from '@/modules/service-payments';
import { FEATURE_MODULES_SIMULATION } from '@/modules/simulation';
import { FEATURE_MODULES_TRANSFERS } from '@/modules/transfers';
import { FEATURE_MODULES_PROFILE } from '@/modules/profile';
import { FEATURE_MODULES_PLIN } from '@/modules/plin';
import { FEATURE_MODULES_LOANS } from '@/modules/loans';
import { FEATURE_MODULES_PROMOTIONS } from '@/modules/promotions';

export const FEATURE_MODULES: Type[] = [
  OperationalAnalyticsModule,
  ...FEATURE_MODULES_SIMULATION,
  ...FEATURE_MODULES_HEALTH,
  MetricsModule,
  ...FEATURE_MODULES_AUTH,
  ...FEATURE_MODULES_HOME,
  ...FEATURE_MODULES_ACCOUNTS,
  ...FEATURE_MODULES_SERVICE_PAYMENTS,
  ...FEATURE_MODULES_TRANSFERS,
  ...FEATURE_MODULES_PROFILE,
  ...FEATURE_MODULES_PLIN,
  ...FEATURE_MODULES_LOANS,
  ...FEATURE_MODULES_PROMOTIONS,
];
