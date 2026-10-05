import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';
export class PredictDto {
  @ApiProperty() @IsNumber() @Min(0) latency!: number;
  @ApiProperty() @IsNumber() @Min(0) errorRate!: number;
  @ApiProperty() @IsNumber() @Min(0) timeoutRate!: number;
  @ApiProperty() @IsNumber() @Min(0) requestRate!: number;
}
