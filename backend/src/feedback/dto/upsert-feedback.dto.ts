import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { FeedbackContentType } from '../enums/feedback-content-type.enum';
import { FeedbackType } from '../enums/feedback-type.enum';

export class UpsertFeedbackDto {
  @ApiProperty({
    enum: FeedbackContentType,
    example: FeedbackContentType.INSIGHT,
  })
  @IsEnum(FeedbackContentType)
  contentType: FeedbackContentType;

  @ApiProperty({ example: 'daily-insight:123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contentId: string;

  @ApiProperty({ enum: FeedbackType, example: FeedbackType.UP })
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;
}
