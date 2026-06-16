import { apiClient } from './api-client';
import { endpoints } from './endpoints';
import type { DashboardResponse } from '../dashboard/dashboard.types';

export async function getDashboard(): Promise<DashboardResponse> {
  const response = await apiClient.get<DashboardResponse>(endpoints.dashboard);
  return response.data;
}
