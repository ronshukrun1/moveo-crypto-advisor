import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
}

export function EmptyState({
  title = 'Nothing here yet',
  message = 'Content will appear here when available.',
  icon,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1,
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ color: 'text.secondary', mb: 0.5 }} aria-hidden>
        {icon ?? <InboxOutlinedIcon sx={{ fontSize: 36 }} />}
      </Box>
      <Typography variant="cardTitle">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
        {message}
      </Typography>
    </Box>
  );
}
