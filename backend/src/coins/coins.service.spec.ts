import { In } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CoinsService } from './coins.service';
import { Coin } from './entities/coin.entity';

describe('CoinsService', () => {
  let coinsService: CoinsService;
  let coinsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
  };

  const activeCoins: Coin[] = [
    {
      id: 2,
      coingeckoId: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 1,
      coingeckoId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const inactiveCoin: Coin = {
    id: 3,
    coingeckoId: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    coinsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoinsService,
        {
          provide: getRepositoryToken(Coin),
          useValue: coinsRepository,
        },
      ],
    }).compile();

    coinsService = module.get(CoinsService);
  });

  it('findAllActive returns active coins sorted by name', async () => {
    coinsRepository.find.mockResolvedValue(activeCoins);

    const result = await coinsService.findAllActive();

    expect(coinsRepository.find).toHaveBeenCalledWith({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    expect(result).toEqual(activeCoins);
  });

  it('getActiveCoinsResponse maps coins without internal fields', async () => {
    coinsRepository.find.mockResolvedValue(activeCoins);

    const result = await coinsService.getActiveCoinsResponse();

    expect(result.items).toEqual([
      {
        id: 2,
        coingeckoId: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
      },
      {
        id: 1,
        coingeckoId: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
      },
    ]);
    expect(result.items[0]).not.toHaveProperty('isActive');
    expect(result.items[0]).not.toHaveProperty('createdAt');
  });

  it('returns an empty list when no active coins exist', async () => {
    coinsRepository.find.mockResolvedValue([]);

    const result = await coinsService.getActiveCoinsResponse();

    expect(result).toEqual({ items: [] });
  });

  it('findByIds returns only active coins for the requested ids', async () => {
    coinsRepository.find.mockResolvedValue([activeCoins[0]]);

    const result = await coinsService.findByIds([1, 3]);

    expect(coinsRepository.find).toHaveBeenCalledWith({
      where: {
        id: In([1, 3]),
        isActive: true,
      },
      order: { name: 'ASC' },
    });
    expect(result).toEqual([activeCoins[0]]);
    expect(result).not.toContainEqual(inactiveCoin);
  });

  it('findByIds returns an empty array for an empty id list', async () => {
    const result = await coinsService.findByIds([]);

    expect(result).toEqual([]);
    expect(coinsRepository.find).not.toHaveBeenCalled();
  });
});
