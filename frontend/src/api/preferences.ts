import type {
  PreferencesRecord,
  UpdatePreferencesInput,
  UpdatePreferencesResponse,
} from '../types/preferences';
import { apiClient } from './api-client';
import { endpoints } from './endpoints';

export async function getPreferences(): Promise<PreferencesRecord> {
  const response = await apiClient.get<PreferencesRecord>(endpoints.preferences);
  return response.data;
}

export async function updatePreferences(
  input: UpdatePreferencesInput,
): Promise<UpdatePreferencesResponse> {
  const response = await apiClient.patch<UpdatePreferencesResponse>(
    endpoints.preferences,
    input,
  );
  return response.data;
}
