import { apiClient } from './api-client';
import { endpoints } from './endpoints';
import type { CoinsListResponse } from '../types/coin';

export async function getSupportedCoins(): Promise<CoinsListResponse> {
  const response = await apiClient.get<CoinsListResponse>(endpoints.coins);
  return response.data;
}
