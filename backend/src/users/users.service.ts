import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository, EntityManager } from 'typeorm';
import { User } from './entities/user.entity';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createUser(
    name: string,
    email: string,
    password: string,
  ): Promise<User> {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await this.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    try {
      const user = this.usersRepository.create({
        name,
        email: normalizedEmail,
        passwordHash,
        onboardingCompleted: false,
      });

      return await this.usersRepository.save(user);
    } catch (error) {
      if (this.isUniqueEmailViolation(error)) {
        throw new ConflictException('Email already registered');
      }

      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByIdWithManager(manager: EntityManager, id: number): Promise<User> {
    const user = await manager.getRepository(User).findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async setOnboardingCompletedWithManager(
    manager: EntityManager,
    userId: number,
  ): Promise<User> {
    const user = await this.findByIdWithManager(manager, userId);
    user.onboardingCompleted = true;

    return manager.getRepository(User).save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  private isUniqueEmailViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string };
    return driverError.code === '23505';
  }
}
