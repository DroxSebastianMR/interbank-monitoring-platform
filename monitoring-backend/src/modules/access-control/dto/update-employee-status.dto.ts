import { ApiProperty } from '@nestjs/swagger';
import { EmployeeStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateEmployeeStatusDto {
  @ApiProperty({ enum: EmployeeStatus })
  @IsEnum(EmployeeStatus)
  status!: EmployeeStatus;
}
