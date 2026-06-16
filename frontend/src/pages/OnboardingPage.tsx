import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AppShell } from '../components/layout/AppShell';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { useAuth } from '../auth/auth-context';

export function OnboardingPage() {
  const { user } = useAuth();

  return (
    <AppShell header={<AuthenticatedHeader subtitle="Set up your profile" />}>
      <PageContainer maxWidth="md">
        <PageHeader
          title="Personalize your dashboard"
          subtitle="Complete onboarding to unlock your dashboard."
        />

        <Box
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            Welcome{user?.name ? `, ${user.name}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Onboarding is required before you can access your dashboard. The full onboarding flow
            will be available in the next stage.
          </Typography>
        </Box>
      </PageContainer>
    </AppShell>
  );
}
