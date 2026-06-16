import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface UnavailableStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
}

export function UnavailableState({
  title = 'Temporarily unavailable',
  message = 'This section could not be loaded right now.',
  icon,
}: UnavailableStateProps) {
  return (
    <Box
      role="status"
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
        {icon ?? <CloudOffOutlinedIcon sx={{ fontSize: 36 }} />}
      </Box>
      <Typography variant="cardTitle">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
        {message}
      </Typography>
    </Box>
  );
}
