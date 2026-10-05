export type NodeEnvironment = 'development' | 'test' | 'production';

export interface AppConfig {
  name: string;
  description: string;
  version: string;
  port: number;
  env: NodeEnvironment;
  simulationEnabled: boolean;
  instanceName: string;
  corsOrigins: string[];
}
