import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { ProfileRepository } from '@/modules/profile/repositories/profile.repository';
import type { UpdateProfileDto } from '@/modules/profile/dto/profile.dto';
import type {
  CreateCustomerAddressDto,
  UpdateCustomerDetailsDto,
} from '@/modules/profile/dto/profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  private response(user: NonNullable<Awaited<ReturnType<ProfileRepository['find']>>>) {
    return { ...user, phoneVerifiedAt: user.phoneVerifiedAt?.toISOString() ?? null };
  }

  async get(userId: string) {
    const user = await this.repository.find(userId);
    if (!user) throw new NotFoundException('Perfil no encontrado');
    return this.response(user);
  }

  async update(userId: string, dto: UpdateProfileDto) {
    if (
      (dto.firstName !== undefined && !dto.firstName.trim()) ||
      (dto.lastName !== undefined && !dto.lastName.trim())
    )
      throw new BadRequestException('El nombre y apellido no pueden estar vacíos');
    const updated = await this.repository.update(userId, {
      ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
      ...(dto.marketingOptIn !== undefined ? { marketingOptIn: dto.marketingOptIn } : {}),
    });
    return this.response(updated);
  }

  async details(userId: string) {
    const item = await this.repository.details(userId);
    return {
      preferredName: item?.preferredName ?? null,
      occupation: item?.occupation ?? null,
      nationalityCode: item?.nationalityCode ?? null,
    };
  }

  async updateDetails(userId: string, dto: UpdateCustomerDetailsDto) {
    const normalize = (value: string | null | undefined) =>
      value === undefined ? undefined : value?.trim() || null;
    await this.repository.upsertDetails(userId, {
      preferredName: normalize(dto.preferredName),
      occupation: normalize(dto.occupation),
      nationalityCode: dto.nationalityCode,
    });
    return this.details(userId);
  }

  addresses(userId: string) {
    return this.repository.addresses(userId);
  }

  async addAddress(userId: string, dto: CreateCustomerAddressDto) {
    const count = (await this.repository.addresses(userId)).length;
    if (count >= 20) throw new BadRequestException('Máximo 20 direcciones');
    const address = this.cleanAddress(dto);
    return this.repository.createAddress(userId, address);
  }

  async updateAddress(userId: string, id: string, dto: CreateCustomerAddressDto) {
    const result = await this.repository.updateAddress(userId, id, this.cleanAddress(dto));
    if (result.count === 0) throw new NotFoundException('Dirección no encontrada');
    return this.repository.address(userId, id);
  }

  async removeAddress(userId: string, id: string) {
    const result = await this.repository.removeAddress(userId, id);
    if (result.count === 0) throw new NotFoundException('Dirección no encontrada');
  }

  private cleanAddress(dto: CreateCustomerAddressDto) {
    const fields = [dto.label, dto.line1, dto.district, dto.province, dto.department];
    if (fields.some((value) => !value.trim()))
      throw new BadRequestException('La dirección no puede tener campos vacíos');
    return {
      label: dto.label.trim(),
      line1: dto.line1.trim(),
      district: dto.district.trim(),
      province: dto.province.trim(),
      department: dto.department.trim(),
      countryCode: dto.countryCode ?? 'PE',
    };
  }

  async startPhoneChallenge(userId: string, phoneNumber: string) {
    // This project has no SMS provider. Never expose a verification code in production.
    if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test')
      throw new ServiceUnavailableException(
        'Se requiere un proveedor SMS para verificar celulares',
      );
    const owner = await this.repository.findPhoneOwner(phoneNumber);
    if (owner && owner.id !== userId) throw new ConflictException('El celular ya está vinculado');
    const previous = await this.repository.findChallenge(userId);
    if (previous && Date.now() - previous.createdAt.getTime() < 60_000)
      throw new BadRequestException('Espera un minuto antes de solicitar otro código');
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const salt = randomBytes(16).toString('hex');
    const codeHash = createHash('sha256').update(`${salt}:${code}`).digest('hex');
    const expiresAt = new Date(Date.now() + 5 * 60_000);
    await this.repository.challenge(userId, phoneNumber, codeHash, salt, expiresAt);
    return { expiresAt: expiresAt.toISOString(), demoCode: code, mode: 'SIMULATED' as const };
  }

  async verifyPhone(userId: string, code: string) {
    const challenge = await this.repository.findChallenge(userId);
    if (!challenge || challenge.expiresAt.getTime() < Date.now() || challenge.attempts >= 5)
      throw new BadRequestException('Código vencido o no disponible');
    const actual = Buffer.from(
      createHash('sha256').update(`${challenge.salt}:${code}`).digest('hex'),
    );
    const expected = Buffer.from(challenge.codeHash);
    if (!timingSafeEqual(actual, expected)) {
      await this.repository.incrementAttempts(userId);
      throw new BadRequestException('Código inválido');
    }
    try {
      return this.response(await this.repository.verify(userId, challenge.phoneNumber));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('El celular ya está vinculado');
      throw error;
    }
  }
}
