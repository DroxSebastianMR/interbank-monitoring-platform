import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional({ example: 'Estado de los servicios' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;
}

export class UpdateConversationDto {
  @ApiPropertyOptional({ example: 'Diagnóstico de login' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsIn([true, false])
  archived?: boolean;
}

export class SendMessageDto {
  @ApiProperty({ example: '¿Cómo está el servicio de login?' })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  content!: string;
}

export class MessageFeedbackDto {
  @ApiProperty({ enum: ['HELPFUL', 'NOT_HELPFUL'] })
  @IsIn(['HELPFUL', 'NOT_HELPFUL'])
  value!: 'HELPFUL' | 'NOT_HELPFUL';
}
