import { ApiProperty } from '@nestjs/swagger';

import {
  EndpointTrafficState,
  TelemetryState,
} from '@/modules/endpoint-observability/enums/endpoint-state.enum';

export class EndpointInstanceDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: TelemetryState }) state!: TelemetryState;
  @ApiProperty({ type: String, nullable: true }) observedAt!: string | null;
  @ApiProperty() endpointCount!: number;
}

export class EndpointMetricDto {
  @ApiProperty({ required: false }) operationId?: string;
  @ApiProperty({ required: false }) application?: string;
  @ApiProperty({ required: false }) version?: string;
  @ApiProperty({ required: false }) controlPolicy?: string;
  @ApiProperty({ type: Number, nullable: true, required: false }) latencyP50Ms?: number | null;
  @ApiProperty({ type: Number, nullable: true, required: false }) latencyP99Ms?: number | null;
  @ApiProperty() instance!: string;
  @ApiProperty() module!: string;
  @ApiProperty() method!: string;
  @ApiProperty({ example: '/accounts/{id}' }) route!: string;
  @ApiProperty({ enum: TelemetryState }) state!: TelemetryState;
  @ApiProperty({ enum: EndpointTrafficState }) traffic!: EndpointTrafficState;
  @ApiProperty({ type: String, nullable: true }) observedAt!: string | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Requests per second over two minutes; not processor frequency',
  })
  requestRateHz!: number | null;
  @ApiProperty({ type: Number, nullable: true }) clientErrorRateHz!: number | null;
  @ApiProperty({ type: Number, nullable: true }) serverErrorRateHz!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Approximate server-side p95 from histogram, milliseconds',
  })
  latencyP95Ms!: number | null;
  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Counter in current Prometheus series, resets with process restart',
  })
  observedRequests!: number | null;
}

export class EndpointSnapshotDto {
  @ApiProperty({ enum: TelemetryState }) sourceState!: TelemetryState;
  @ApiProperty() generatedAt!: string;
  @ApiProperty({ type: String, nullable: true }) lastSuccessAt!: string | null;
  @ApiProperty() refreshIntervalMs!: number;
  @ApiProperty() windowSeconds!: number;
  @ApiProperty({ type: [EndpointInstanceDto] }) instances!: EndpointInstanceDto[];
  @ApiProperty({ type: [EndpointMetricDto] }) endpoints!: EndpointMetricDto[];
}

export class StreamCursorDto {
  @ApiProperty() streamId!: string;
  @ApiProperty() sequence!: number;
}
export class LiveEndpointSnapshotDto extends EndpointSnapshotDto {
  @ApiProperty({ type: StreamCursorDto }) cursor!: StreamCursorDto;
}
