import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

import type { AuthConfig } from '@/config';

@Injectable()
export class CredentialProofService {
  private readonly pepper: string;

  constructor(configService: ConfigService) {
    this.pepper = configService.getOrThrow<AuthConfig>('auth').sessionPepper;
  }

  create(userId: string, deviceId: string, password: string): string {
    return createHmac('sha256', this.pepper)
      .update(userId)
      .update('\0')
      .update(deviceId)
      .update('\0')
      .update(password)
      .digest('base64url');
  }

  matches(expectedProof: string, userId: string, deviceId: string, password: string): boolean {
    const actual = Buffer.from(this.create(userId, deviceId, password));
    const expected = Buffer.from(expectedProof);

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}
