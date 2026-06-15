import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Coin } from '../coins/entities/coin.entity';
import { CoinsService } from '../coins/coins.service';
import { UsersService } from '../users/users.service';
import { UserSelectedCoin } from './entities/user-selected-coin.entity';
import { SelectedCoinsService } from './selected-coins.service';

describe('SelectedCoinsService', () => {
  let selectedCoinsService: SelectedCoinsService;
  let userSelectedCoinsRepository: {
    find: jest.Mock;
    delete: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let transactionRepository: {
    delete: jest.Mock;
    find: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let coinsService: { findByIds: jest.Mock };
  let usersService: { findById: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  const userId = 1;
  const bitcoin: Coin = {
    id: 1,
    coingeckoId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const ethereum: Coin = {
    id: 2,
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    transactionRepository = {
      delete: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((data: Partial<UserSelectedCoin>) => data),
    };
    userSelectedCoinsRepository = {
      find: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };
    coinsService = {
      findByIds: jest.fn(),
    };
    usersService = {
      findById: jest.fn(),
    };
    dataSource = {
      transaction: jest.fn(
        (
          callback: (manager: {
            getRepository: () => typeof transactionRepository;
          }) => unknown,
        ) =>
          Promise.resolve(
            callback({
              getRepository: () => transactionRepository,
            }),
          ),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelectedCoinsService,
        {
          provide: getRepositoryToken(UserSelectedCoin),
          useValue: userSelectedCoinsRepository,
        },
        {
          provide: CoinsService,
          useValue: coinsService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    selectedCoinsService = module.get(SelectedCoinsService);
  });

  it('returns selected active coins sorted by name', async () => {
    usersService.findById.mockResolvedValue({ id: userId });
    userSelectedCoinsRepository.find.mockResolvedValue([
      {
        userId,
        coinId: bitcoin.id,
        coin: bitcoin,
        createdAt: new Date(),
      },
      {
        userId,
        coinId: ethereum.id,
        coin: ethereum,
        createdAt: new Date(),
      },
    ]);

    const result = await selectedCoinsService.getSelectedCoins(userId);

    expect(userSelectedCoinsRepository.find).toHaveBeenCalledWith({
      where: { userId, coin: { isActive: true } },
      relations: { coin: true },
      order: { coin: { name: 'ASC' } },
    });
    expect(result.items).toEqual([
      {
        id: 1,
        coingeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      },
      {
        id: 2,
        coingeckoId: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
      },
    ]);
    expect(result.items[0]).not.toHaveProperty('userId');
    expect(result.items[0]).not.toHaveProperty('createdAt');
  });

  it('returns an empty array when none are selected', async () => {
    usersService.findById.mockResolvedValue({ id: userId });
    userSelectedCoinsRepository.find.mockResolvedValue([]);

    const result = await selectedCoinsService.getSelectedCoins(userId);

    expect(result).toEqual({ items: [] });
  });

  it('replaces existing selections and preserves unchanged rows', async () => {
    usersService.findById.mockResolvedValue({ id: userId });
    coinsService.findByIds.mockResolvedValue([bitcoin, ethereum]);
    transactionRepository.find.mockResolvedValue([{ coinId: bitcoin.id }]);

    const result = await selectedCoinsService.replaceSelectedCoins(userId, {
      coinIds: [bitcoin.id, ethereum.id],
    });

    expect(transactionRepository.delete).toHaveBeenCalled();
    expect(transactionRepository.save).toHaveBeenCalledWith([
      { userId, coinId: ethereum.id },
    ]);
    expect(result.message).toBe('Selected coins updated successfully');
    expect(result.items).toHaveLength(2);
  });

  it('clears selections when coinIds is empty', async () => {
    usersService.findById.mockResolvedValue({ id: userId });

    const result = await selectedCoinsService.replaceSelectedCoins(userId, {
      coinIds: [],
    });

    expect(transactionRepository.delete).toHaveBeenCalledWith({ userId });
    expect(transactionRepository.save).not.toHaveBeenCalled();
    expect(result.items).toEqual([]);
  });

  it('rejects inactive or missing coin IDs', async () => {
    usersService.findById.mockResolvedValue({ id: userId });
    coinsService.findByIds.mockResolvedValue([bitcoin]);

    await expect(
      selectedCoinsService.replaceSelectedCoins(userId, {
        coinIds: [bitcoin.id, 99],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('returns 404 when the authenticated user no longer exists', async () => {
    usersService.findById.mockRejectedValue(
      new NotFoundException('User not found'),
    );

    await expect(
      selectedCoinsService.getSelectedCoins(userId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rolls back when the transaction fails', async () => {
    usersService.findById.mockResolvedValue({ id: userId });
    coinsService.findByIds.mockResolvedValue([bitcoin]);
    transactionRepository.delete.mockRejectedValue(new Error('db failure'));

    await expect(
      selectedCoinsService.replaceSelectedCoins(userId, {
        coinIds: [bitcoin.id],
      }),
    ).rejects.toThrow('db failure');
  });
});
