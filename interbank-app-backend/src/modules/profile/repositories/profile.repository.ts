import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/common/prisma/prisma.service';

export const PROFILE_SELECT = {
  id: true,
  documentNumber: true,
  email: true,
  firstName: true,
  lastName: true,
  phoneNumber: true,
  phoneVerifiedAt: true,
  marketingOptIn: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId }, select: PROFILE_SELECT });
  }

  details(userId: string) {
    return this.prisma.customerDetails.findUnique({ where: { userId } });
  }

  upsertDetails(
    userId: string,
    data: {
      preferredName?: string | null;
      occupation?: string | null;
      nationalityCode?: string | null;
    },
  ) {
    return this.prisma.customerDetails.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }

  addresses(userId: string) {
    return this.prisma.customerAddress.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 20,
    });
  }

  createAddress(userId: string, data: Omit<Prisma.CustomerAddressUncheckedCreateInput, 'userId'>) {
    return this.prisma.customerAddress.create({ data: { ...data, userId } });
  }

  updateAddress(userId: string, id: string, data: Prisma.CustomerAddressUpdateInput) {
    return this.prisma.customerAddress.updateMany({ where: { id, userId }, data });
  }

  address(userId: string, id: string) {
    return this.prisma.customerAddress.findFirst({ where: { id, userId } });
  }

  removeAddress(userId: string, id: string) {
    return this.prisma.customerAddress.deleteMany({ where: { id, userId } });
  }

  update(
    userId: string,
    data: { firstName?: string; lastName?: string; marketingOptIn?: boolean },
  ) {
    return this.prisma.user.update({ where: { id: userId }, data, select: PROFILE_SELECT });
  }

  findPhoneOwner(phoneNumber: string) {
    return this.prisma.user.findUnique({ where: { phoneNumber }, select: { id: true } });
  }

  challenge(userId: string, phoneNumber: string, codeHash: string, salt: string, expiresAt: Date) {
    return this.prisma.phoneChallenge.upsert({
      where: { userId },
      create: { userId, phoneNumber, codeHash, salt, expiresAt },
      update: { phoneNumber, codeHash, salt, expiresAt, attempts: 0, createdAt: new Date() },
    });
  }

  findChallenge(userId: string) {
    return this.prisma.phoneChallenge.findUnique({ where: { userId } });
  }

  incrementAttempts(userId: string) {
    return this.prisma.phoneChallenge.update({
      where: { userId },
      data: { attempts: { increment: 1 } },
    });
  }

  async verify(userId: string, phoneNumber: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { phoneNumber, phoneVerifiedAt: new Date() },
        select: PROFILE_SELECT,
      });
      await tx.phoneChallenge.delete({ where: { userId } });
      await tx.plinEnrollment.deleteMany({
        where: { userId, phoneNumber: { not: phoneNumber } },
      });
      return user;
    });
  }
}
