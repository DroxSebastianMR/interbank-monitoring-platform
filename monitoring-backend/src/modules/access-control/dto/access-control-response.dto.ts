import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EmployeeProfileDto } from '@/modules/auth/dto/auth-response.dto';

export class PermissionDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'incidents.manage' }) code!: string;
  @ApiProperty({ example: 'incidents' }) resource!: string;
  @ApiProperty({ example: 'manage' }) action!: string;
  @ApiPropertyOptional() description!: string | null;
}

export class RoleDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'IT_ENGINEER' }) code!: string;
  @ApiProperty({ example: 'Ingeniería TI' }) name!: string;
  @ApiPropertyOptional() description!: string | null;
  @ApiProperty({ type: [String] }) permissions!: string[];
  @ApiProperty() isSystem!: boolean;
}

export class EmployeeRolesUpdatedDto extends EmployeeProfileDto {}

export class EmployeeSummaryDto extends EmployeeProfileDto {
  @ApiProperty({ enum: ['ACTIVE', 'DISABLED'] }) status!: 'ACTIVE' | 'DISABLED';
  @ApiPropertyOptional() lastLoginAt!: Date | null;
}
