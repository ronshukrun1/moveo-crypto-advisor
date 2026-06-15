import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('coins')
export class Coin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  coingeckoId: string;

  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
