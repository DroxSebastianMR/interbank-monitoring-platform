import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { MonitoredServicesService } from '@/modules/monitored-services/services/monitored-services.service';

export interface DiscoveredServiceCandidate {
  code: string;
  name: string;
  endpoint: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  registered: boolean;
}

export interface ServiceDiscoveryReport {
  source: 'openapi';
  generatedAt: string;
  services: DiscoveredServiceCandidate[];
}

type OpenApiOperation = { tags?: unknown };
type OpenApiPathItem = { get?: OpenApiOperation };
type OpenApiDocument = { paths?: Record<string, OpenApiPathItem | undefined> };

const DISCOVERY_CACHE_MS = 15_000;

@Injectable()
export class ServiceDiscoveryService {
  private cachedCandidates?: {
    expiresAt: number;
    value: Omit<DiscoveredServiceCandidate, 'registered'>[];
  };

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly monitoredServices: MonitoredServicesService,
  ) {}

  async discover(forceRefresh = false): Promise<ServiceDiscoveryReport> {
    if (!forceRefresh && this.cachedCandidates && this.cachedCandidates.expiresAt > Date.now()) {
      return this.withRegistrationState(this.cachedCandidates.value);
    }

    const baseUrl = this.config.get<string>('integrations.appBackendUrl', 'http://localhost:8080')
      .replace(/\/$/, '');
    let document: OpenApiDocument;

    try {
      const response = await firstValueFrom(
        this.http.get<OpenApiDocument>(`${baseUrl}/api/docs-json`, {
          timeout: 2_500,
          maxRedirects: 0,
          maxContentLength: 2 * 1024 * 1024,
        }),
      );
      document = response.data;
    } catch {
      throw new BadGatewayException(
        'No se pudo leer el contrato OpenAPI del backend bancario para descubrir servicios',
      );
    }

    const candidates = this.parse(document);
    this.cachedCandidates = { expiresAt: Date.now() + DISCOVERY_CACHE_MS, value: candidates };
    return this.withRegistrationState(candidates);
  }

  async sync(actorId: string) {
    const report = await this.discover(true);
    let added = 0;

    for (const candidate of report.services) {
      if (candidate.registered) continue;
      if (await this.monitoredServices.registerDiscovered(candidate, actorId)) added += 1;
    }

    this.cachedCandidates = undefined;
    const updated = await this.discover(true);
    return { ...updated, added };
  }

  private withRegistrationState(
    candidates: Omit<DiscoveredServiceCandidate, 'registered'>[],
  ): ServiceDiscoveryReport {
    return {
      source: 'openapi',
      generatedAt: new Date().toISOString(),
      services: candidates.map((candidate) => ({
        ...candidate,
        registered: this.monitoredServices.find(candidate.code) !== undefined,
      })),
    };
  }

  private parse(document: OpenApiDocument): Omit<DiscoveredServiceCandidate, 'registered'>[] {
    const unique = new Map<string, Omit<DiscoveredServiceCandidate, 'registered'>>();

    for (const [endpoint, item] of Object.entries(document.paths ?? {})) {
      const match = /^\/([a-z][a-z-]*)\/health$/.exec(endpoint);
      if (!match || !item?.get) continue;

      const code = match[1];
      const tag = this.firstTag(item.get.tags) ?? code;
      unique.set(code, {
        code,
        name: this.toDisplayName(tag),
        endpoint,
        criticality: this.defaultCriticality(code),
      });
    }

    return [...unique.values()].sort((left, right) => left.name.localeCompare(right.name, 'es'));
  }

  private firstTag(value: unknown): string | undefined {
    if (!Array.isArray(value) || typeof value[0] !== 'string') return undefined;
    return value[0];
  }

  private toDisplayName(value: string): string {
    return value
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  private defaultCriticality(code: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (code === 'auth') return 'CRITICAL';
    if (code === 'accounts' || code === 'transfers') return 'HIGH';
    return 'MEDIUM';
  }
}
