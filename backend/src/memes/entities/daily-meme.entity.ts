import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface MemeSourceDataSnapshot {
  templateId: number;
  captionVariationId: string;
  investorProfile: string;
  selectedCoins: Array<{
    id: number;
    symbol: string;
    name: string;
  }>;
  selectedMarketItem: {
    symbol: string;
    name: string;
    changePercentage24h: number | null;
  };
}

@Entity('daily_memes')
@Unique('UQ_daily_memes_user_date', ['userId', 'generatedForDate'])
export class DailyMeme {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  templateId: number;

  @Column()
  imageUrl: string;

  @Column()
  pageUrl: string;

  @Column()
  textTop: string;

  @Column()
  textBottom: string;

  @Column({ type: 'date' })
  generatedForDate: string;

  @Column({ type: 'jsonb' })
  sourceDataSnapshot: MemeSourceDataSnapshot;

  @Column()
  contextHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
