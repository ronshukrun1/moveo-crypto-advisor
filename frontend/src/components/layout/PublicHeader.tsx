import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { AppLogo } from '../common/AppLogo';
import { PrimaryButton } from '../common/PrimaryButton';

export function PublicHeader() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'transparent',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64, md: 72 },
          px: { xs: 2, sm: 3, md: 4 },
          justifyContent: 'space-between',
        }}
      >
        <AppLogo />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <Button
            component={RouterLink}
            to="/login"
            color="inherit"
            sx={{ fontWeight: 600, display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Sign In
          </Button>
          <RouterLink to="/register" style={{ textDecoration: 'none' }}>
            <PrimaryButton size="medium" sx={{ px: 2.5 }}>
              Get Started
            </PrimaryButton>
          </RouterLink>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
