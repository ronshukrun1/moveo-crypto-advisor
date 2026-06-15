import { User } from '../entities/user.entity';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  onboardingCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export function toUserResponse(
  user: User,
  options?: { includeTimestamps?: boolean },
): UserResponse {
  const response: UserResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    onboardingCompleted: user.onboardingCompleted,
  };

  if (options?.includeTimestamps) {
    response.createdAt = user.createdAt;
    response.updatedAt = user.updatedAt;
  }

  return response;
}
