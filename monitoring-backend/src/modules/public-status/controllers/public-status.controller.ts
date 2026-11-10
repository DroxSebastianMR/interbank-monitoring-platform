import { Controller, Get, Header, Param, ParseUUIDPipe, Query, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { PublicStatusRepository } from '@/modules/public-status/repositories/public-status.repository';
import { PublicStatusQueryDto } from '@/modules/public-status/dto/public-status-query.dto';

@ApiTags('Public status')
@Controller('public/status')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 120, ttl: 60_000 } })
export class PublicStatusController {
  constructor(private readonly repository: PublicStatusRepository, private readonly config: ConfigService) {}
  private requireEnabled() {
    if (this.config.get<string>('PUBLIC_STATUS_ENABLED', 'false') !== 'true') {
      throw new ServiceUnavailableException('La publicación de estado no está habilitada.');
    }
  }

  @Get()
  @Header('Cache-Control', 'no-store')
  @Header('Access-Control-Allow-Origin', '*')
  snapshot(@Query() query: PublicStatusQueryDto) { this.requireEnabled(); return this.repository.snapshot(query.service); }

  @Get('history')
  @Header('Cache-Control', 'no-store')
  @Header('Access-Control-Allow-Origin', '*')
  history(@Query() query: PublicStatusQueryDto) { this.requireEnabled(); return this.repository.history(query.service, query.cursor); }

  @Get('notices/:id')
  @Header('Cache-Control', 'no-store')
  @Header('Access-Control-Allow-Origin', '*')
  notice(@Param('id', ParseUUIDPipe) id: string) { this.requireEnabled(); return this.repository.notice(id); }
}
