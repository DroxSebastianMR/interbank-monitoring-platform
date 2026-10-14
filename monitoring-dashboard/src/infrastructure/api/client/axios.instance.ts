import axios from 'axios';

import { env } from '@/app/config/env';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 5_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

export async function apiGet<T>(path: string): Promise<T> {
  return (await apiClient.get<T>(path)).data;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return (await apiClient.post<T>(path, body)).data;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return (await apiClient.patch<T>(path, body)).data;
}
