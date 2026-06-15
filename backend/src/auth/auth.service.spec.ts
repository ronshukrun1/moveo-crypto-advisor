import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/entities/user.entity';
import { toUserResponse } from '../users/mappers/user-response.mapper';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: {
    createUser: jest.Mock;
    findByEmail: jest.Mock;
    validatePassword: jest.Mock;
    findById: jest.Mock;
  };
  let jwtService: { signAsync: jest.Mock };

  const user: User = {
    id: 1,
    name: 'Ron',
    email: 'ron@example.com',
    passwordHash: 'hashed-password',
    onboardingCompleted: false,
    createdAt: new Date('2026-06-15T12:00:00.000Z'),
    updatedAt: new Date('2026-06-15T12:00:00.000Z'),
  };

  beforeEach(async () => {
    usersService = {
      createUser: jest.fn(),
      findByEmail: jest.fn(),
      validatePassword: jest.fn(),
      findById: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  it('registers a user without exposing passwordHash', async () => {
    usersService.createUser.mockResolvedValue(user);

    const result = await authService.register({
      name: 'Ron',
      email: 'ron@example.com',
      password: 'StrongPass123!',
    });

    expect(result.user).toEqual(
      toUserResponse(user, { includeTimestamps: true }),
    );
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('logs in with valid credentials and signs a JWT payload', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    usersService.validatePassword.mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('jwt-token');

    const result = await authService.login({
      email: 'ron@example.com',
      password: 'StrongPass123!',
    });

    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'ron@example.com',
    });
    expect(result.accessToken).toBe('jwt-token');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid passwords with a generic message', async () => {
    usersService.findByEmail.mockResolvedValue(user);
    usersService.validatePassword.mockResolvedValue(false);

    await expect(
      authService.login({
        email: 'ron@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects unknown email with the same generic message', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'missing@example.com',
        password: 'StrongPass123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
