import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Ron' })
  name: string;

  @ApiProperty({ example: 'ron@example.com' })
  email: string;

  @ApiProperty({ example: false })
  onboardingCompleted: boolean;

  @ApiPropertyOptional({ example: '2026-06-15T12:00:00.000Z' })
  createdAt?: Date;

  @ApiPropertyOptional({ example: '2026-06-15T12:00:00.000Z' })
  updatedAt?: Date;
}

export class RegisterResponseDto {
  @ApiProperty({ example: 'User registered successfully' })
  message: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ example: 'jwt.access.token' })
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
