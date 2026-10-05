import type { NodeEnvironment } from '@/config/application/app-config.interface';

export const SUPPORTED_NODE_ENVIRONMENTS: NodeEnvironment[] = ['development', 'test', 'production'];

export const MINIMUM_JWT_SECRET_LENGTH = 32;
