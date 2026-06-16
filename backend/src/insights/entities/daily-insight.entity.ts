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

export interface InsightSourceDataSnapshot {
  investorProfile: string;
  selectedCoins: Array<{
    id: number;
    symbol: string;
    name: string;
  }>;
  marketFacts: Array<{
    symbol: string;
    name: string;
    currentPrice: number | null;
    changePercentage24h: number | null;
    high24h: number | null;
    low24h: number | null;
  }>;
  newsFacts: Array<{
    id: string;
    title: string;
    description: string | null;
  }>;
}

@Entity('daily_insights')
@Unique('UQ_daily_insights_user_date', ['userId', 'generatedForDate'])
export class DailyInsight {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'date' })
  generatedForDate: string;

  @Column({ type: 'jsonb' })
  sourceDataSnapshot: InsightSourceDataSnapshot;

  @Column()
  contextHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
