import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RefreshSessionDto {
  @ApiProperty({ description: 'Token opaco emitido durante login o refresh' })
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  refreshToken!: string;
}
