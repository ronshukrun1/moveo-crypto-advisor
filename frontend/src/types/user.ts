export interface User {
  id: number;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}
