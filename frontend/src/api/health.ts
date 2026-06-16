import { apiClient } from './api-client';
import { endpoints } from './endpoints';

export interface HealthCheckResult {
  status: 'ok';
  timestamp: string;
  database: {
    status: 'up';
  };
}

export async function getHealth(): Promise<HealthCheckResult> {
  const response = await apiClient.get<HealthCheckResult>(endpoints.health);
  return response.data;
}
