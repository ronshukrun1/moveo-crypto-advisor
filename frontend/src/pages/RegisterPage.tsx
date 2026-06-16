import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
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

export function RegisterPage() {
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
              <PersonAddOutlinedIcon />
            </Box>
            <Typography component="h1" variant="pageTitle">
              Create your account
            </Typography>
            <Typography variant="muted" sx={{ mt: 1 }}>
              Sign up to get started
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
                  placeholder="Create a password"
                  autoComplete="new-password"
                  disabled
                />
                <PasswordTextField
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  disabled
                />
                <PrimaryButton type="button" disabled sx={{ mt: 1 }}>
                  Create account
                </PrimaryButton>
              </Box>
            </CardContent>
          </Card>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
            Already have an account?{' '}
            <Box
              component={RouterLink}
              to="/login"
              sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
            >
              Log in
            </Box>
          </Typography>
        </Box>
      </PageContainer>
    </AppShell>
  );
}
