import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { PrimaryButton } from '../common/PrimaryButton';

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  actionLabel,
  onAction,
  icon,
}: ErrorStateProps) {
  return (
    <Box
      role="alert"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.5,
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ color: 'error.main', mb: 0.5 }} aria-hidden>
        {icon ?? <ErrorOutlineRoundedIcon sx={{ fontSize: 40 }} />}
      </Box>
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        {message}
      </Typography>
      {actionLabel && onAction ? (
        <PrimaryButton onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </PrimaryButton>
      ) : null}
    </Box>
  );
}
