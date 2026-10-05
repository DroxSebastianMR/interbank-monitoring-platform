import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export enum SimulationMode {
  NORMAL = 'NORMAL',
  SLOW = 'SLOW',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT',
  DOWN = 'DOWN',
}
@Injectable()
export class SimulationService {
  private readonly modes = new Map<string, SimulationMode>();
  constructor(private readonly config: ConfigService) {}
  isEnabled() {
    return (
      this.config.get('app.env') === 'development' ||
      this.config.get('app.simulationEnabled') === true
    );
  }
  setMode(service: string, mode: SimulationMode) {
    if (!this.isEnabled())
      throw new ServiceUnavailableException('Simulation endpoints are disabled');
    this.modes.set(service, mode);
    return { service, mode };
  }
  getModes() {
    return Object.fromEntries(this.modes);
  }
  async apply(service: string) {
    const mode = this.modes.get(service) ?? SimulationMode.NORMAL;
    if (mode === SimulationMode.SLOW) await this.delay(1500);
    if (mode === SimulationMode.TIMEOUT) await this.delay(15000);
    if (mode === SimulationMode.ERROR) throw new Error(`Simulated ${service} error`);
    if (mode === SimulationMode.DOWN)
      throw new ServiceUnavailableException(`${service} is simulated as down`);
  }
  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
