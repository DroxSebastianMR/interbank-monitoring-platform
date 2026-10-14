import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AI_ASSISTANT_TIMEOUT_MS } from '@/modules/ai-integration/constants/ai-integration.constants';
import type { PredictDto } from '@/modules/ai-integration/dto/predict.dto';
import type {
  AiHealth,
  AiResult,
  AssistantAnswer,
  AssistantEvidence,
  WindowAnalysis,
} from '@/modules/ai-integration/types/ai-integration.types';
import type { MetricWindow } from '@/modules/monitoring/interfaces/metric-window.interface';

@Injectable()
export class AiIntegrationService {
  private readonly baseUrl: string;
  private readonly internalToken: string | undefined;
  constructor(
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.baseUrl = config.get<string>('integrations.aiServiceUrl', 'http://localhost:8000');
    this.internalToken = config.get<string>('AI_INTERNAL_TOKEN') || undefined;
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
        timeout: AI_ASSISTANT_TIMEOUT_MS,
        headers: this.internalToken ? { 'X-Internal-Token': this.internalToken } : undefined,
      }),
    );
    return response.data;
  }
}
