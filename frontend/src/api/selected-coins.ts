import type { CoinsListResponse } from '../types/coin';
import type {
  ReplaceSelectedCoinsInput,
  ReplaceSelectedCoinsResponse,
} from '../types/preferences';
import { apiClient } from './api-client';
import { endpoints } from './endpoints';

export async function getSelectedCoins(): Promise<CoinsListResponse> {
  const response = await apiClient.get<CoinsListResponse>(endpoints.selectedCoins);
  return response.data;
}

export async function replaceSelectedCoins(
  input: ReplaceSelectedCoinsInput,
): Promise<ReplaceSelectedCoinsResponse> {
  const response = await apiClient.put<ReplaceSelectedCoinsResponse>(
    endpoints.selectedCoins,
    input,
  );
  return response.data;
}
