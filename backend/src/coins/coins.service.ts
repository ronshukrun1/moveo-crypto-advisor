import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CoinItemDto } from './dto/coin-response.dto';
import { Coin } from './entities/coin.entity';
import { toCoinItemDto } from './mappers/coin-response.mapper';

@Injectable()
export class CoinsService {
  constructor(
    @InjectRepository(Coin)
    private readonly coinsRepository: Repository<Coin>,
  ) {}

  async findAllActive(): Promise<Coin[]> {
    return this.coinsRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: number): Promise<Coin | null> {
    return this.coinsRepository.findOne({
      where: { id, isActive: true },
    });
  }

  async findByIds(ids: number[]): Promise<Coin[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.coinsRepository.find({
      where: {
        id: In(ids),
        isActive: true,
      },
      order: { name: 'ASC' },
    });
  }

  async getActiveCoinsResponse(): Promise<{ items: CoinItemDto[] }> {
    const coins = await this.findAllActive();

    return {
      items: coins.map(toCoinItemDto),
    };
  }
}
