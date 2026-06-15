import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { toUserResponse } from '../users/mappers/user-response.mapper';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser, JwtPayload } from './interfaces/auth.interfaces';

@Injectable()
export class AuthService {
  private static readonly INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials';

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.createUser(
      registerDto.name,
      registerDto.email,
      registerDto.password,
    );

    return {
      message: 'User registered successfully',
      user: toUserResponse(user, { includeTimestamps: true }),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException(AuthService.INVALID_CREDENTIALS_MESSAGE);
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(AuthService.INVALID_CREDENTIALS_MESSAGE);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return {
      message: 'Login successful',
      accessToken: await this.jwtService.signAsync(payload),
      user: toUserResponse(user),
    };
  }

  async getCurrentUser(authenticatedUser: AuthenticatedUser) {
    const user = await this.usersService.findById(authenticatedUser.id);
    return toUserResponse(user, { includeTimestamps: true });
  }
}
