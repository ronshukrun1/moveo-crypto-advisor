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
import { FeedbackContentType } from '../enums/feedback-content-type.enum';
import { FeedbackType } from '../enums/feedback-type.enum';

@Entity('feedback')
@Unique('UQ_feedback_user_content', ['userId', 'contentType', 'contentId'])
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: FeedbackContentType })
  contentType: FeedbackContentType;

  @Column({ type: 'varchar', length: 255 })
  contentId: string;

  @Column({ type: 'enum', enum: FeedbackType })
  feedbackType: FeedbackType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
