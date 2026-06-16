import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';

interface AppLogoProps {
  to?: string;
  size?: 'small' | 'medium';
}

export function AppLogo({ to = '/', size = 'medium' }: AppLogoProps) {
  const iconSize = size === 'small' ? 28 : 32;
  const fontSize = size === 'small' ? '1rem' : '1.125rem';

  const content = (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        aria-hidden
        sx={{
          width: iconSize,
          height: iconSize,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TrendingUpRoundedIcon sx={{ fontSize: iconSize * 0.6 }} />
      </Box>
      <Typography
        component="span"
        sx={{ fontWeight: 700, fontSize, color: 'text.primary', letterSpacing: '-0.01em' }}
      >
        CryptoAdvisor
      </Typography>
    </Box>
  );

  if (to) {
    return (
      <RouterLink to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </RouterLink>
    );
  }

  return content;
}
