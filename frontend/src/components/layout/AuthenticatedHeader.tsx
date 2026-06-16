import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
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
