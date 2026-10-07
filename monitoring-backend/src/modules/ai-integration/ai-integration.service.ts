import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { PredictDto } from '@/modules/ai-integration/dto/predict.dto';
export interface AiResult {
  anomaly: boolean;
  anomalyScore: number;
  riskLevel: string;
  modelMode?: string;
}

export interface AiHealth {
  status: string;
  modelMode?: string;
}

@Injectable()
export class AiIntegrationService {
  private readonly baseUrl: string;
  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.get<string>('aiServiceUrl', 'http://localhost:8000');
  }
  async health(): Promise<AiHealth> {
    const response = await firstValueFrom(this.http.get<AiHealth>(`${this.baseUrl}/health`));
    return response.data;
  }
  async predict(dto: PredictDto): Promise<AiResult> {
    const response = await firstValueFrom(this.http.post<AiResult>(`${this.baseUrl}/predict`, dto));
    return response.data;
  }
}
