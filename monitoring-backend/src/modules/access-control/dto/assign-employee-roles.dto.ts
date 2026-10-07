import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsEnum } from 'class-validator';

import { EmployeeRoleCode } from '@/modules/auth/enums/employee-role-code.enum';

export class AssignEmployeeRolesDto {
  @ApiProperty({ enum: EmployeeRoleCode, isArray: true, example: ['IT_ENGINEER'] })
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsEnum(EmployeeRoleCode, { each: true })
  roleCodes!: EmployeeRoleCode[];
}
