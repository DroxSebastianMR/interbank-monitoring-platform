import { HttpModule } from '@nestjs/axios';
import { EndpointStreamService } from '@/modules/endpoint-observability/services/endpoint-stream.service';
import { Module } from '@nestjs/common';

import { EndpointObservabilityController } from '@/modules/endpoint-observability/controllers/endpoint-observability.controller';
import { EndpointObservabilityService } from '@/modules/endpoint-observability/services/endpoint-observability.service';
import { EndpointPrometheusService } from '@/modules/endpoint-observability/services/endpoint-prometheus.service';

@Module({
  imports: [HttpModule],
  controllers: [EndpointObservabilityController],
  providers: [EndpointObservabilityService, EndpointPrometheusService, EndpointStreamService],
})
export class EndpointObservabilityModule {}
