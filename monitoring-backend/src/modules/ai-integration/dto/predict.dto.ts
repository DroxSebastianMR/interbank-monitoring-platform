import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class PredictDto {
  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  latency!: number;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  errorRate!: number;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  timeoutRate!: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  requestRate!: number;
}
