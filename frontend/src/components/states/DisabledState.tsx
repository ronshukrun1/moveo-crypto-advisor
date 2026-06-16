import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface DisabledStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
}

export function DisabledState({
  title = 'Section disabled',
  message = 'Enable this section in your preferences to view content here.',
  icon,
}: DisabledStateProps) {
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
        opacity: 0.75,
      }}
    >
      <Box sx={{ color: 'text.secondary', mb: 0.5 }} aria-hidden>
        {icon ?? <BlockOutlinedIcon sx={{ fontSize: 36 }} />}
      </Box>
      <Typography variant="cardTitle">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>
        {message}
      </Typography>
    </Box>
  );
}
