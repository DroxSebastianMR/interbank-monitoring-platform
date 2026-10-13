import { Injectable } from '@nestjs/common';

import { hashPassword, verifyPassword } from '@/common/security/password-hasher';

@Injectable()
export class PasswordService {
  hash(value: string): Promise<string> {
    return hashPassword(value);
  }

  compare(value: string, passwordHash: string): Promise<boolean> {
    return verifyPassword(value, passwordHash);
  }
}
