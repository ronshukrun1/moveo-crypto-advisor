import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PageContainer } from '../components/layout/PageContainer';
import { PublicHeader } from '../components/layout/PublicHeader';
import { AppTextField } from '../components/common/AppTextField';
import { PasswordTextField } from '../components/common/PasswordTextField';
import { PrimaryButton } from '../components/common/PrimaryButton';

export function LoginPage() {
  return (
    <AppShell header={<PublicHeader />}>
      <PageContainer maxWidth="sm">
        <Box sx={{ py: { xs: 4, md: 6 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              aria-hidden
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <LoginOutlinedIcon />
            </Box>
            <Typography component="h1" variant="pageTitle">
              Welcome back
            </Typography>
            <Typography variant="muted" sx={{ mt: 1 }}>
              Sign in to your account
            </Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <AppTextField
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled
                  startIcon={<EmailOutlinedIcon fontSize="small" />}
                />
                <PasswordTextField
                  label="Password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled
                />
                <PrimaryButton type="button" disabled sx={{ mt: 1 }}>
                  Sign in
                </PrimaryButton>
              </Box>
            </CardContent>
          </Card>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
            Don&apos;t have an account?{' '}
            <Box
              component={RouterLink}
              to="/register"
              sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
            >
              Create one
            </Box>
          </Typography>
        </Box>
      </PageContainer>
    </AppShell>
  );
}
