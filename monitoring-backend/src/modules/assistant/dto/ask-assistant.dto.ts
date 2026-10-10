import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AskAssistantDto {
  @ApiProperty({ example: '¿Cómo está el servicio de login?' })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  question!: string;
}
