import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { AppShell } from '../components/layout/AppShell';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PageContainer } from '../components/layout/PageContainer';
import { ErrorState } from '../components/states/ErrorState';
import { DashboardGrid } from '../dashboard/DashboardGrid';
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton';
import { PreferencesLink } from '../dashboard/PreferencesLink';
import { useDashboard } from '../dashboard/use-dashboard';
import { formatIsoDateTime } from '../utils/formatting';

function getPageErrorMessage(statusCode?: number): { title: string; message: string } {
  if (statusCode === 404) {
    return {
      title: 'Account not found',
      message: 'Your account could not be found. Please sign in again or contact support.',
    };
  }

  return {
    title: 'Unable to load dashboard',
    message: 'We could not load your dashboard right now. Please try again.',
  };
}

export function DashboardPage() {
  const { dashboard, phase, error, refresh, retry } = useDashboard();
  const isInitialLoading = phase === 'initial' && !dashboard;
  const isRefreshing = phase === 'refreshing';
  const showRefreshError = Boolean(error && dashboard);

  const headerSubtitle = dashboard
    ? `Updated ${formatIsoDateTime(dashboard.generatedAt)}`
    : undefined;

  if (isInitialLoading) {
    return (
      <AppShell header={<AuthenticatedHeader />}>
        <PageContainer maxWidth="xl">
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" component="h1">
              Dashboard
            </Typography>
          </Box>
          <DashboardSkeleton />
        </PageContainer>
      </AppShell>
    );
  }

  if (phase === 'error' && error && !dashboard) {
    const { title, message } = getPageErrorMessage(error.statusCode);

    return (
      <AppShell header={<AuthenticatedHeader />}>
        <PageContainer maxWidth="md">
          <ErrorState
            title={title}
            message={message}
            actionLabel="Try again"
            onAction={() => {
              void retry();
            }}
          />
        </PageContainer>
      </AppShell>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <AppShell header={<AuthenticatedHeader subtitle={headerSubtitle} />}>
      <PageContainer maxWidth="xl">
        {isRefreshing ? (
          <LinearProgress
            sx={{ mb: 2, borderRadius: 1 }}
            aria-label="Refreshing dashboard"
          />
        ) : null}

        <Box
          sx={{
            mb: 3,
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="h5" component="h1">
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Personalized market insights for your selected coins.
            </Typography>
            <Box sx={{ mt: 1 }}>
              <PreferencesLink>Customize dashboard</PreferencesLink>
            </Box>
          </Box>

          <IconButton
            aria-label="Refresh dashboard"
            onClick={() => {
              void refresh();
            }}
            disabled={isRefreshing}
            sx={{ border: '1px solid', borderColor: 'divider' }}
          >
            <RefreshRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {showRefreshError ? (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
            action={
              <IconButton
                aria-label="Retry dashboard refresh"
                color="inherit"
                size="small"
                onClick={() => {
                  void refresh();
                }}
              >
                <RefreshRoundedIcon fontSize="inherit" />
              </IconButton>
            }
          >
            Dashboard refresh failed. Showing your last loaded content.
          </Alert>
        ) : null}

        <DashboardGrid dashboard={dashboard} />
      </PageContainer>
    </AppShell>
  );
}
