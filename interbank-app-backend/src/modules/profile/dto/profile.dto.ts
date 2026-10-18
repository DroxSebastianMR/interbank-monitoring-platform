import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName?: string;
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() marketingOptIn?: boolean;
}

export class StartPhoneChallengeDto {
  @ApiProperty({ example: '987654321' }) @IsString() @Matches(/^9\d{8}$/) phoneNumber!: string;
}

export class VerifyPhoneChallengeDto {
  @ApiProperty({ example: '123456' }) @IsString() @Matches(/^\d{6}$/) code!: string;
}

export class ProfileResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() documentNumber!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ nullable: true, type: String }) firstName!: string | null;
  @ApiProperty({ nullable: true, type: String }) lastName!: string | null;
  @ApiProperty({ nullable: true, type: String }) phoneNumber!: string | null;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' }) phoneVerifiedAt!:
    string | null;
  @ApiProperty() marketingOptIn!: boolean;
}

export class UpdateCustomerDetailsDto {
  @ApiPropertyOptional({ nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  preferredName?: string | null;
  @ApiPropertyOptional({ nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupation?: string | null;
  @ApiPropertyOptional({ nullable: true, example: 'PE' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  nationalityCode?: string | null;
}

export class CustomerDetailsResponseDto {
  @ApiProperty({ nullable: true, type: String }) preferredName!: string | null;
  @ApiProperty({ nullable: true, type: String }) occupation!: string | null;
  @ApiProperty({ nullable: true, type: String }) nationalityCode!: string | null;
}

export class CreateCustomerAddressDto {
  @ApiProperty({ maxLength: 40 }) @IsString() @MinLength(1) @MaxLength(40) label!: string;
  @ApiProperty({ maxLength: 200 }) @IsString() @MinLength(1) @MaxLength(200) line1!: string;
  @ApiProperty({ maxLength: 100 }) @IsString() @MinLength(1) @MaxLength(100) district!: string;
  @ApiProperty({ maxLength: 100 }) @IsString() @MinLength(1) @MaxLength(100) province!: string;
  @ApiProperty({ maxLength: 100 }) @IsString() @MinLength(1) @MaxLength(100) department!: string;
  @ApiPropertyOptional({ example: 'PE' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/)
  countryCode?: string;
}

export class CustomerAddressResponseDto extends CreateCustomerAddressDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
}
