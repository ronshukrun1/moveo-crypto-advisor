import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Coin } from '../../coins/entities/coin.entity';
import { User } from '../../users/entities/user.entity';

@Entity('user_selected_coins')
export class UserSelectedCoin {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  coinId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Coin, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coinId' })
  coin: Coin;

  @CreateDateColumn()
  createdAt: Date;
}
