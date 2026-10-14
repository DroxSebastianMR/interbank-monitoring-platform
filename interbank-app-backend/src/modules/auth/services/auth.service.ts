import { Injectable } from '@nestjs/common';

import type { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import type { DeviceLoginDto } from '@/modules/auth/dto/device-login.dto';
import type { FirstLoginDto } from '@/modules/auth/dto/first-login.dto';
import type {
  BiometricCredentialDto,
  BiometricEnrollmentDto,
  BiometricLoginDto,
} from '@/modules/auth/dto/biometric-credential.dto';
import { BiometricLoginService } from '@/modules/auth/services/biometric-login.service';
import { LoginService } from '@/modules/auth/services/login.service';
import { SimulationService } from '@/modules/simulation/services/simulation.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly simulation: SimulationService,
    private readonly loginService: LoginService,
    private readonly biometricLoginService: BiometricLoginService,
  ) {}

  async health(): Promise<{ status: string; service: string }> {
    await this.simulation.apply('auth');
    return { status: 'ok', service: 'auth' };
  }

  async login(input: FirstLoginDto): Promise<AuthResponseDto> {
    await this.simulation.apply('auth');
    return this.loginService.firstLogin(input);
  }

  async deviceLogin(input: DeviceLoginDto): Promise<AuthResponseDto> {
    await this.simulation.apply('auth');
    return this.loginService.deviceLogin(input);
  }

  async enrollBiometrics(input: BiometricEnrollmentDto): Promise<BiometricCredentialDto> {
    await this.simulation.apply('auth');
    return this.biometricLoginService.enroll(input);
  }

  async biometricLogin(input: BiometricLoginDto): Promise<AuthResponseDto> {
    await this.simulation.apply('auth');
    return this.biometricLoginService.login(input);
  }

  async revokeBiometrics(input: BiometricLoginDto): Promise<void> {
    await this.biometricLoginService.revoke(input);
  }
}
