import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { InvestorProfile } from '../enums/investor-profile.enum';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: InvestorProfile,
    enumName: 'investor_profile_enum',
    default: InvestorProfile.BEGINNER,
  })
  investorProfile: InvestorProfile;

  @Column({ default: true })
  showMarketPrices: boolean;

  @Column({ default: true })
  showNews: boolean;

  @Column({ default: true })
  showAiInsight: boolean;

  @Column({ default: true })
  showMeme: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
