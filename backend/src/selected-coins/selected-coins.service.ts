import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Not, Repository } from 'typeorm';
import { CoinItemDto } from '../coins/dto/coin-response.dto';
import { Coin } from '../coins/entities/coin.entity';
import { CoinsService } from '../coins/coins.service';
import { toCoinItemDto } from '../coins/mappers/coin-response.mapper';
import { UsersService } from '../users/users.service';
import { ReplaceSelectedCoinsDto } from './dto/replace-selected-coins.dto';
import { UserSelectedCoin } from './entities/user-selected-coin.entity';

@Injectable()
export class SelectedCoinsService {
  constructor(
    @InjectRepository(UserSelectedCoin)
    private readonly userSelectedCoinsRepository: Repository<UserSelectedCoin>,
    private readonly coinsService: CoinsService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async getSelectedCoins(userId: number): Promise<{ items: CoinItemDto[] }> {
    await this.ensureUserExists(userId);

    const selections = await this.userSelectedCoinsRepository.find({
      where: { userId, coin: { isActive: true } },
      relations: { coin: true },
      order: { coin: { name: 'ASC' } },
    });

    return {
      items: selections.map((selection) => toCoinItemDto(selection.coin)),
    };
  }

  async replaceSelectedCoins(
    userId: number,
    replaceDto: ReplaceSelectedCoinsDto,
  ): Promise<{ message: string; items: CoinItemDto[] }> {
    await this.ensureUserExists(userId);

    const { coinIds } = replaceDto;
    const validatedCoins = await this.validateActiveCoinIds(coinIds);

    await this.dataSource.transaction(async (manager) => {
      await this.replaceWithManager(manager, userId, coinIds);
    });

    return {
      message: 'Selected coins updated successfully',
      items: validatedCoins.map(toCoinItemDto),
    };
  }

  async replaceWithManager(
    manager: EntityManager,
    userId: number,
    coinIds: number[],
  ): Promise<void> {
    const repository = manager.getRepository(UserSelectedCoin);

    if (coinIds.length === 0) {
      await repository.delete({ userId });
      return;
    }

    await repository.delete({
      userId,
      coinId: Not(In(coinIds)),
    });

    const existingSelections = await repository.find({
      where: { userId },
      select: { coinId: true },
    });
    const existingCoinIds = new Set(
      existingSelections.map((selection) => selection.coinId),
    );
    const coinIdsToInsert = coinIds.filter(
      (coinId) => !existingCoinIds.has(coinId),
    );

    if (coinIdsToInsert.length > 0) {
      await repository.save(
        coinIdsToInsert.map((coinId) => repository.create({ userId, coinId })),
      );
    }
  }

  async validateActiveCoinIds(coinIds: number[]): Promise<Coin[]> {
    if (coinIds.length === 0) {
      return [];
    }

    const coins = await this.coinsService.findByIds(coinIds);

    if (coins.length !== coinIds.length) {
      const foundIds = new Set(coins.map((coin) => coin.id));
      const invalidIds = coinIds.filter((coinId) => !foundIds.has(coinId));

      throw new BadRequestException(
        `Invalid or inactive coin IDs: ${invalidIds.join(', ')}`,
      );
    }

    return coins;
  }

  private async ensureUserExists(userId: number): Promise<void> {
    try {
      await this.usersService.findById(userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('User not found');
      }

      throw error;
    }
  }
}
