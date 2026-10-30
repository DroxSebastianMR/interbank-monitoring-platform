import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { PUBLIC_SERVICES } from '@/modules/public-status/policies/public-notice.policy';

export class PublicStatusQueryDto {
  @IsOptional()
  @IsIn(Object.keys(PUBLIC_SERVICES))
  service?: string;

  @IsOptional()
  @IsUUID()
  cursor?: string;
}
