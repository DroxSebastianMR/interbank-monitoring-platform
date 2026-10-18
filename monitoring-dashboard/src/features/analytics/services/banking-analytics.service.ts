import { z } from 'zod';
import { apiGet } from '@/infrastructure/api/client/axios.instance';
const count = z.number().int().nonnegative();
const schema = z.object({ source: z.literal('POSTGRESQL_BUSINESS_OPERATIONS'), generatedAt: z.string(), today: z.string(), summary: z.object({ total: count, completed: count, previousTotal: count, successRate: z.number().min(0).max(1).nullable() }), buckets: z.array(z.object({ date: z.string(), hour: count.max(23), category: z.enum(['PLIN', 'TRANSFER', 'SERVICE_PAYMENT']), status: z.enum(['COMPLETED', 'PENDING', 'FAILED', 'REVERSED']), count })).max(10000) });
export const bankingAnalyticsService = { snapshot: async () => schema.parse(await apiGet<unknown>('/analytics/banking')) };
