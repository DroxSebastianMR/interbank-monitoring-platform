import type { Type } from '@nestjs/common';
import { RealtimeModule } from '@/modules/realtime/realtime.module';
import { FEATURE_MODULES_PUBLIC_STATUS } from '@/modules/public-status';

import { FEATURE_MODULES_AUTH } from '@/modules/auth';
import { FEATURE_MODULES_ACCESS_CONTROL } from '@/modules/access-control';
import { FEATURE_MODULES_AI_INTEGRATION } from '@/modules/ai-integration';
import { FEATURE_MODULES_DETECTION } from '@/modules/detection';
import { FEATURE_MODULES_HEALTH } from '@/modules/health';
import { FEATURE_MODULES_MONITORED_SERVICES } from '@/modules/monitored-services';
import { FEATURE_MODULES_MONITORING } from '@/modules/monitoring';
import { FEATURE_MODULES_SERVICE_STATE } from '@/modules/service-state';
import { FEATURE_MODULES_INCIDENTS } from '@/modules/incidents';
import { FEATURE_MODULES_ALERTS } from '@/modules/alerts';
import { FEATURE_MODULES_NOTIFICATIONS } from '@/modules/notifications';
import { FEATURE_MODULES_METRICS } from '@/modules/metrics';
import { FEATURE_MODULES_ANALYTICS } from '@/modules/analytics';
import { FEATURE_MODULES_AUDIT } from '@/modules/audit';
import { FEATURE_MODULES_ASSISTANT } from '@/modules/assistant';
import { FEATURE_MODULES_ENDPOINT_OBSERVABILITY } from '@/modules/endpoint-observability';

export const FEATURE_MODULES: Type[] = [
  RealtimeModule,
  ...FEATURE_MODULES_PUBLIC_STATUS,
  ...FEATURE_MODULES_AUTH,
  ...FEATURE_MODULES_ACCESS_CONTROL,
  ...FEATURE_MODULES_AI_INTEGRATION,
  ...FEATURE_MODULES_DETECTION,
  ...FEATURE_MODULES_HEALTH,
  ...FEATURE_MODULES_MONITORED_SERVICES,
  ...FEATURE_MODULES_MONITORING,
  ...FEATURE_MODULES_SERVICE_STATE,
  ...FEATURE_MODULES_INCIDENTS,
  ...FEATURE_MODULES_ALERTS,
  ...FEATURE_MODULES_NOTIFICATIONS,
  ...FEATURE_MODULES_METRICS,
  ...FEATURE_MODULES_ANALYTICS,
  ...FEATURE_MODULES_AUDIT,
  ...FEATURE_MODULES_ASSISTANT,
  ...FEATURE_MODULES_ENDPOINT_OBSERVABILITY,
];
