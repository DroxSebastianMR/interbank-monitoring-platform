import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeProfileDto {
  @ApiProperty() id!: string;
  @ApiProperty({ example: 'TI-0042' }) employeeCode!: string;
  @ApiProperty({ example: 'ingeniero@interbank.example' }) corporateEmail!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiPropertyOptional() jobTitle!: string | null;
  @ApiPropertyOptional() department!: string | null;
  @ApiProperty({ type: [String] }) roles!: string[];
  @ApiProperty({ type: [String] }) permissions!: string[];
}

export class TokenPairDto {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: 'Bearer';
  @ApiProperty({ example: 900 }) accessTokenExpiresIn!: number;
  @ApiProperty({ example: 2_592_000 }) refreshTokenExpiresIn!: number;
}

export class AuthResponseDto {
  @ApiProperty({ example: true }) authenticated!: true;
  @ApiProperty({ type: TokenPairDto }) tokens!: TokenPairDto;
  @ApiProperty({ type: EmployeeProfileDto }) employee!: EmployeeProfileDto;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true }) loggedOut!: true;
}
