import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'ON_CALL_ENGINEER' })
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]{2,59}$/)
  code!: string;

  @ApiProperty({ example: 'Ingeniero de guardia' })
  @IsString()
  @Length(3, 100)
  name!: string;

  @ApiPropertyOptional({ example: 'Atiende incidentes durante su turno' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ type: [String], example: ['dashboard.read', 'incidents.read'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes!: string[];
}

export class UpdateRoleDto {
  @ApiProperty({ example: 'Ingeniero de guardia' })
  @IsString()
  @Length(3, 100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes!: string[];
}
