import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsString, Matches } from 'class-validator';

export class AssignEmployeeRolesDto {
  @ApiProperty({ type: [String], example: ['IT_ENGINEER'] })
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/^[A-Z][A-Z0-9_]{2,59}$/, { each: true })
  roleCodes!: string[];
}
