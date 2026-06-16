import { ApiProperty } from '@nestjs/swagger';
import { FeedbackContentType } from '../enums/feedback-content-type.enum';
import { FeedbackType } from '../enums/feedback-type.enum';

export class FeedbackResponseDto {
  @ApiProperty({
    enum: FeedbackContentType,
    example: FeedbackContentType.INSIGHT,
  })
  contentType: FeedbackContentType;

  @ApiProperty({ example: 'daily-insight:123' })
  contentId: string;

  @ApiProperty({ enum: FeedbackType, example: FeedbackType.UP })
  feedbackType: FeedbackType;

  @ApiProperty({ example: '2026-06-16T10:00:00.000Z' })
  updatedAt: string;
}

export class FeedbackListResponseDto {
  @ApiProperty({ type: [FeedbackResponseDto] })
  items: FeedbackResponseDto[];
}
