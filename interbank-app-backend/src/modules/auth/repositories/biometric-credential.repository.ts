import { Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class BiometricCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  save(input: {
    userId: string;
    deviceId: string;
    tokenHash: string;
    credentialProof: string;
    expiresAt: Date;
  }) {
    return this.prisma.biometricCredential.upsert({
      where: { userId_deviceId: { userId: input.userId, deviceId: input.deviceId } },
      create: input,
      update: {
        tokenHash: input.tokenHash,
        credentialProof: input.credentialProof,
        expiresAt: input.expiresAt,
        revokedAt: null,
        lastUsedAt: null,
      },
    });
  }

  findActive(tokenHash: string, deviceId: string) {
    return this.prisma.biometricCredential.findFirst({
      where: {
        tokenHash,
        deviceId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
        user: { status: UserStatus.ACTIVE },
      },
      select: {
        id: true,
        userId: true,
        deviceId: true,
        credentialProof: true,
        user: {
          select: {
            id: true,
            documentNumber: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.biometricCredential.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  async revoke(tokenHash: string, deviceId: string): Promise<void> {
    await this.prisma.biometricCredential.updateMany({
      where: { tokenHash, deviceId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
