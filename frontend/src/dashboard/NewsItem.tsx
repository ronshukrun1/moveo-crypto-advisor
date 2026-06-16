import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { NewsItem as NewsItemType } from './dashboard.types';
import { formatRelativePublicationTime } from '../utils/formatting';

interface NewsItemProps {
  item: NewsItemType;
}

export function NewsItem({ item }: NewsItemProps) {
  return (
    <Box
      component="article"
      sx={{
        display: 'flex',
        gap: 1.5,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 'none' },
      }}
    >
      {item.imageUrl ? (
        <Box
          component="img"
          src={item.imageUrl}
          alt=""
          sx={{
            width: 72,
            height: 72,
            objectFit: 'cover',
            borderRadius: 2,
            flexShrink: 0,
            bgcolor: 'background.paper',
          }}
        />
      ) : null}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="inherit"
          variant="body1"
          sx={{ fontWeight: 600, display: 'inline-block', mb: 0.5 }}
        >
          {item.title}
        </Link>

        {item.description ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
            {item.description}
          </Typography>
        ) : null}

        <Typography variant="metadata" color="text.secondary">
          {[item.sourceName, formatRelativePublicationTime(item.publishedAt)]
            .filter((value) => value && value !== '—')
            .join(' · ')}
        </Typography>
      </Box>
    </Box>
  );
}
