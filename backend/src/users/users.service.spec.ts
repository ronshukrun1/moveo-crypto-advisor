import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { QueryFailedError } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };

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
    usersRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
      ],
    }).compile();

    usersService = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('hashes the password when creating a user', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.create.mockReturnValue(user);
    usersRepository.save.mockResolvedValue(user);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    await usersService.createUser('Ron', 'Ron@Example.com', 'StrongPass123!');

    expect(bcrypt.hash).toHaveBeenCalledWith('StrongPass123!', 12);
    expect(usersRepository.create).toHaveBeenCalledWith({
      name: 'Ron',
      email: 'ron@example.com',
      passwordHash: 'hashed-password',
      onboardingCompleted: false,
    });
  });

  it('rejects duplicate email before save', async () => {
    usersRepository.findOne.mockResolvedValue(user);

    await expect(
      usersService.createUser('Ron', 'ron@example.com', 'StrongPass123!'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('handles unique email race conditions safely', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.create.mockReturnValue(user);
    usersRepository.save.mockRejectedValue(
      new QueryFailedError('INSERT', [], {
        code: '23505',
      } as Error),
    );
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    await expect(
      usersService.createUser('Ron', 'ron@example.com', 'StrongPass123!'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
