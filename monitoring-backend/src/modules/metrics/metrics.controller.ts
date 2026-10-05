import { Controller, Get, Header } from '@nestjs/common';
@Controller('metrics')
export class MetricsController {
  @Get() @Header('Content-Type', 'text/plain; version=0.0.4') metrics() {
    return '# HELP monitoring_backend_up Monitoring backend availability\n# TYPE monitoring_backend_up gauge\nmonitoring_backend_up 1\n';
  }
}
