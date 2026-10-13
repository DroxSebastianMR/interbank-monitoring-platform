import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { PredictDto } from '@/modules/ai-integration/dto/predict.dto';
import type { MetricWindow } from '@/modules/monitoring/metric-window.service';
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
export interface WindowAnalysis {
  serviceId: string;
  status: 'OK' | 'INSUFFICIENT_DATA';
  anomalyScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  modelMode: 'baseline' | 'isolation_forest';
  reasons: string[];
}
export interface AssistantEvidence {
  question: string;
  asOf: string;
  services: Array<{
    id: string;
    name: string;
    status: string;
    lastCheckedAt: string | null;
    latencyMs: number | null;
  }>;
  incidents: Array<{ id: string; serviceId: string; title: string; status: string }>;
}
export interface AssistantAnswer {
  answer: string;
  provider: 'deterministic' | 'openai' | 'gemini';
  asOf: string;
  evidenceServiceIds: string[];
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
  async analyzeWindow(window: MetricWindow): Promise<WindowAnalysis> {
    const response = await firstValueFrom(
      this.http.post<WindowAnalysis>(`${this.baseUrl}/v1/anomalies/analyze`, window),
    );
    return response.data;
  }
  async answerQuestion(evidence: AssistantEvidence): Promise<AssistantAnswer> {
    const response = await firstValueFrom(
      this.http.post<AssistantAnswer>(`${this.baseUrl}/v1/assistant/answer`, evidence, {
        timeout: 9000,
      }),
    );
    return response.data;
  }
}
