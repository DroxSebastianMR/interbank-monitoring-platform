import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import { AUTH_LIMITS } from '@/modules/auth/constants/auth.constants';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'TI-0042' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,30}$/)
  employeeCode!: string;

  @ApiProperty({ example: 'ingeniero@empresa.example' })
  @IsEmail()
  @MaxLength(254)
  corporateEmail!: string;

  @ApiProperty({ minLength: AUTH_LIMITS.passwordMinLength })
  @IsString()
  @Length(AUTH_LIMITS.passwordMinLength, AUTH_LIMITS.passwordMaxLength)
  password!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 80)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  lastName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @ApiProperty({ type: [String], example: ['VIEWER'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[A-Z][A-Z0-9_]{2,59}$/, { each: true })
  roleCodes!: string[];
}
