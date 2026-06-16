import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AppLogo } from '../common/AppLogo';
import { useAuth } from '../../auth/auth-context';

interface AuthenticatedHeaderProps {
  subtitle?: string;
}

function formatToday(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

export function AuthenticatedHeader({ subtitle = formatToday() }: AuthenticatedHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64, md: 72 },
          px: { xs: 2, sm: 3, md: 4 },
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <AppLogo to={user?.onboardingCompleted ? '/dashboard' : '/onboarding'} />
          {subtitle ? (
            <Typography variant="metadata" sx={{ mt: 0.5, display: { xs: 'none', sm: 'block' } }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Link
            component={RouterLink}
            to="/preferences"
            underline="hover"
            color="text.secondary"
            variant="body2"
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 600,
            }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 16 }} aria-hidden />
            Preferences
          </Link>
          <IconButton
            component={RouterLink}
            to="/preferences"
            aria-label="Preferences"
            sx={{
              display: { xs: 'inline-flex', md: 'none' },
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <SettingsOutlinedIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.name ?? 'Account'}
          </Typography>
          <IconButton
            aria-label="Sign out"
            onClick={handleLogout}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
