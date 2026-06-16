import { apiClient } from './api-client';
import { endpoints } from './endpoints';
import type {
  CompleteOnboardingInput,
  CompleteOnboardingResponse,
} from '../types/onboarding';

export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<CompleteOnboardingResponse> {
  const response = await apiClient.post<CompleteOnboardingResponse>(
    endpoints.onboarding,
    input,
  );
  return response.data;
}
