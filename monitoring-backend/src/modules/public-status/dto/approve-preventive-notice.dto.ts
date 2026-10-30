import { IsIn, IsInt, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';
import { PUBLIC_SERVICES } from '@/modules/public-status/policies/public-notice.policy';

export class ApprovePreventiveNoticeDto {
  @IsIn(Object.keys(PUBLIC_SERVICES))
  serviceKey!: string;

  @IsInt()
  @Min(1)
  expectedServiceVersion!: number;

  @IsUUID()
  commandId!: string;

  @IsString()
  @Matches(/\S/)
  @MaxLength(500)
  reason!: string;
}
