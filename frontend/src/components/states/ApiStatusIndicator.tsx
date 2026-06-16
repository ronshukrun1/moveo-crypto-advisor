import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { getHealth } from '../../api/health';

type ApiStatus = 'loading' | 'connected' | 'unavailable';

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<ApiStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    getHealth()
      .then(() => {
        if (!cancelled) {
          setStatus('connected');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('unavailable');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const label =
    status === 'loading'
      ? 'Checking connection…'
      : status === 'connected'
        ? 'API connected'
        : 'API unavailable';

  const dotColor =
    status === 'loading'
      ? 'text.secondary'
      : status === 'connected'
        ? 'success.main'
        : 'error.main';

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.75,
        borderRadius: 999,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: dotColor,
        }}
      />
      <Typography variant="metadata">{label}</Typography>
    </Box>
  );
}
