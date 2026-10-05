import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

import { PASSWORD_HASH_ROUNDS } from '@/modules/auth/constants/auth.constants';

@Injectable()
export class PasswordService {
  hash(value: string): Promise<string> {
    return hash(value, PASSWORD_HASH_ROUNDS);
  }

  compare(value: string, passwordHash: string): Promise<boolean> {
    return compare(value, passwordHash);
  }
}
