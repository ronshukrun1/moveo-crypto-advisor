import { useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { SectionCard } from '../components/layout/SectionCard';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import { ErrorState } from '../components/states/ErrorState';
import { EmptyState } from '../components/states/EmptyState';
import { CoinSelectionStep } from '../onboarding/components/CoinSelectionStep';
import { ContentPreferencesStep } from '../onboarding/components/ContentPreferencesStep';
import { InvestorProfileStep } from '../onboarding/components/InvestorProfileStep';
import { PreferencesSkeleton } from '../preferences/PreferencesSkeleton';
import { usePreferencesPage } from '../preferences/use-preferences-page';

function getLoadErrorMessage(statusCode?: number): { title: string; message: string } {
  if (statusCode === 404) {
    return {
      title: 'Account not found',
      message: 'Your account could not be found. Please sign in again.',
    };
  }

  return {
    title: 'Unable to load preferences',
    message: 'We could not load your preferences right now. Please try again.',
  };
}

export function PreferencesPage() {
  const navigate = useNavigate();
  const {
    form,
    supportedCoins,
    phase,
    loadError,
    formError,
    saveMessage,
    saveOutcome,
    hasChanges,
    canSave,
    isSaving,
    setInvestorProfile,
    togglePreference,
    toggleCoin,
    save,
    discardChanges,
    retryLoad,
  } = usePreferencesPage();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const handleBackToDashboard = () => {
    if (hasChanges) {
      const shouldLeave = window.confirm(
        'You have unsaved changes. Leave without saving?',
      );

      if (!shouldLeave) {
        return;
      }
    }

    navigate('/dashboard');
  };

  if (phase === 'initial' && !form) {
    return (
      <AppShell header={<AuthenticatedHeader subtitle="Preferences" />}>
        <PageContainer maxWidth="md">
          <PageHeader
            title="Dashboard Preferences"
            subtitle="Update your profile, content, and selected coins."
          />
          <PreferencesSkeleton />
        </PageContainer>
      </AppShell>
    );
  }

  if (phase === 'error' && loadError && !form) {
    const { title, message } = getLoadErrorMessage(loadError.statusCode);

    return (
      <AppShell header={<AuthenticatedHeader subtitle="Preferences" />}>
        <PageContainer maxWidth="md">
          <ErrorState
            title={title}
            message={message}
            actionLabel="Try again"
            onAction={() => {
              void retryLoad();
            }}
          />
        </PageContainer>
      </AppShell>
    );
  }

  if (!form) {
    return null;
  }

  const coinsState =
    supportedCoins.length === 0
      ? { status: 'empty' as const }
      : { status: 'success' as const, coins: supportedCoins };

  const saveAlertSeverity =
    saveOutcome === 'success'
      ? 'success'
      : saveOutcome === 'partial'
        ? 'warning'
        : 'error';

  return (
    <AppShell header={<AuthenticatedHeader subtitle="Preferences" />}>
      <PageContainer maxWidth="md">
        <PageHeader
          title="Dashboard Preferences"
          subtitle="Update your profile, content, and selected coins."
        />

        {saveMessage ? (
          <Alert severity={saveAlertSeverity} role="status" sx={{ mb: 3 }}>
            {saveMessage}
            {saveOutcome === 'success' ? (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Your updated dashboard will be reflected the next time it loads.
              </Typography>
            ) : null}
          </Alert>
        ) : null}

        {formError ? (
          <Alert severity="error" role="alert" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        ) : null}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
          <SectionCard title="Investor Profile">
            <InvestorProfileStep
              selectedProfile={form.investorProfile}
              onSelect={setInvestorProfile}
            />
          </SectionCard>

          <SectionCard title="Dashboard Content">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose which sections appear on your dashboard. Disabled sections remain
              hidden or unavailable until you turn them back on.
            </Typography>
            <ContentPreferencesStep
              preferences={{
                showMarketPrices: form.showMarketPrices,
                showNews: form.showNews,
                showAiInsight: form.showAiInsight,
                showMeme: form.showMeme,
              }}
              onToggle={togglePreference}
            />
          </SectionCard>

          <SectionCard title="Selected Coins">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Market data, news, insights, and memes are based on your selected coins.
              At least one coin must remain selected.
            </Typography>

            {supportedCoins.length === 0 ? (
              <EmptyState
                title="No coins available"
                message="Supported coins are not available right now. Please try again later."
              />
            ) : (
              <CoinSelectionStep
                coinsState={coinsState}
                selectedCoinIds={form.selectedCoinIds}
                onToggleCoin={toggleCoin}
                onRetry={() => {
                  void retryLoad();
                }}
              />
            )}
          </SectionCard>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <PrimaryButton
            loading={isSaving}
            disabled={!canSave}
            onClick={() => {
              void save();
            }}
          >
            Save Changes
          </PrimaryButton>

          <SecondaryButton
            disabled={!hasChanges || isSaving}
            onClick={discardChanges}
          >
            Discard Changes
          </SecondaryButton>

          <SecondaryButton onClick={handleBackToDashboard}>
            Back to Dashboard
          </SecondaryButton>
        </Box>
      </PageContainer>
    </AppShell>
  );
}
