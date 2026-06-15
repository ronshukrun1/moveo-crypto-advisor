export interface JwtPayload {
  sub: number;
  email: string;
}

export class AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  onboardingCompleted: boolean;
}
