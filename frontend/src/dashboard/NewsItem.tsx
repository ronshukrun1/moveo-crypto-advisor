import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { NewsItem as NewsItemType } from './dashboard.types';
import { FeedbackControls } from './FeedbackControls';
import type { DashboardFeedbackController } from './use-dashboard-feedback';
import { formatRelativePublicationTime } from '../utils/formatting';

interface NewsItemProps {
  item: NewsItemType;
  feedback: DashboardFeedbackController;
}

const THUMBNAIL_SIZE = 72;

const thumbnailContainerSx = {
  width: THUMBNAIL_SIZE,
  height: THUMBNAIL_SIZE,
  flexShrink: 0,
} as const;

function lineClamp(lines: number) {
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  } as const;
}

interface NewsArticleThumbnailProps {
  title: string;
  imageUrl: string | null;
}

function NewsArticleThumbnail({ title, imageUrl }: NewsArticleThumbnailProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPlaceholder = !imageUrl || imageFailed;

  return (
    <Box data-testid="news-article-thumbnail" sx={thumbnailContainerSx}>
      {showPlaceholder ? (
        <Box
          aria-hidden
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            bgcolor: 'action.hover',
            color: 'text.secondary',
          }}
        >
          <ArticleOutlinedIcon fontSize="medium" />
        </Box>
      ) : (
        <Box
          component="img"
          src={imageUrl}
          alt={`Article image for ${title}`}
          onError={() => {
            setImageFailed(true);
          }}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: 2,
            bgcolor: 'background.paper',
            display: 'block',
          }}
        />
      )}
    </Box>
  );
}

export function NewsItem({ item, feedback }: NewsItemProps) {
  const metadata = [item.sourceName, formatRelativePublicationTime(item.publishedAt)]
    .filter((value) => value && value !== '—')
    .join(' · ');

  return (
    <Box
      component="article"
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      <NewsArticleThumbnail title={item.title} imageUrl={item.imageUrl} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="inherit"
          variant="body1"
          sx={{
            fontWeight: 600,
            mb: 0.5,
            ...lineClamp(2),
          }}
        >
          {item.title}
        </Link>

        {item.description ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 0.75, ...lineClamp(3) }}
          >
            {item.description}
          </Typography>
        ) : null}

        {metadata ? (
          <Typography variant="metadata" color="text.secondary" sx={lineClamp(1)}>
            {metadata}
          </Typography>
        ) : null}

        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          variant="body2"
          color="primary"
          sx={{ display: 'inline-block', mt: 0.75 }}
        >
          Read article
        </Link>

        <FeedbackControls
          currentVote={feedback.getVote('NEWS', item.feedbackContentId)}
          disabled={feedback.isSaving('NEWS', item.feedbackContentId)}
          error={feedback.getError('NEWS', item.feedbackContentId)}
          onVote={(feedbackType) => {
            void feedback.vote('NEWS', item.feedbackContentId, feedbackType);
          }}
        />
      </Box>
    </Box>
  );
}
