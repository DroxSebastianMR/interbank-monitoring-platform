import { Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';
import type { AuthenticatedUser } from '@/modules/auth/types/auth.types';

const AUTH_USER_SELECT = {
  id: true,
  documentNumber: true,
  email: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
} as const;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveByIdentity(documentNumber: string, email: string): Promise<AuthenticatedUser | null> {
    return this.prisma.user.findFirst({
      where: { documentNumber, email, status: UserStatus.ACTIVE },
      select: AUTH_USER_SELECT,
    });
  }

  findActiveById(id: string): Promise<AuthenticatedUser | null> {
    return this.prisma.user.findFirst({
      where: { id, status: UserStatus.ACTIVE },
      select: AUTH_USER_SELECT,
    });
  }

  async recordSuccessfulLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
