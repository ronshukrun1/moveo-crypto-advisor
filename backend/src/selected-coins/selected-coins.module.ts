import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CoinsModule } from '../coins/coins.module';
import { UsersModule } from '../users/users.module';
import { UserSelectedCoin } from './entities/user-selected-coin.entity';
import { SelectedCoinsController } from './selected-coins.controller';
import { SelectedCoinsService } from './selected-coins.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserSelectedCoin]),
    UsersModule,
    CoinsModule,
    AuthModule,
  ],
  controllers: [SelectedCoinsController],
  providers: [SelectedCoinsService],
})
export class SelectedCoinsModule {}
