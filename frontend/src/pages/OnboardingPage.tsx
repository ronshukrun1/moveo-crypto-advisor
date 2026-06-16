import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/api-error';
import { completeOnboarding } from '../api/onboarding';
import { useAuth } from '../auth/auth-context';
import { AppShell } from '../components/layout/AppShell';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { ErrorState } from '../components/states/ErrorState';
import { CoinSelectionStep } from '../onboarding/components/CoinSelectionStep';
import { ContentPreferencesStep } from '../onboarding/components/ContentPreferencesStep';
import { InvestorProfileStep } from '../onboarding/components/InvestorProfileStep';
import { OnboardingActions } from '../onboarding/components/OnboardingActions';
import { OnboardingProgress } from '../onboarding/components/OnboardingProgress';
import {
  buildOnboardingRequest,
  mapOnboardingErrorMessage,
  validateStep,
} from '../onboarding/onboarding-validation';
import { useOnboardingFlow } from '../onboarding/use-onboarding-flow';
import { useSupportedCoins } from '../onboarding/use-supported-coins';
import type { OnboardingStep } from '../types/onboarding';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const {
    state,
    setStep,
    setInvestorProfile,
    togglePreference,
    toggleCoin,
  } = useOnboardingFlow();
  const coinsQuery = useSupportedCoins();

  const [stepError, setStepError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  const coinsLoaded = coinsQuery.isLoaded;
  const currentStepValidation = validateStep(state.step, state, coinsLoaded);
  const canContinue = currentStepValidation === null;

  const coinsState =
    coinsQuery.status === 'success'
      ? { status: 'success' as const, coins: coinsQuery.coins }
      : coinsQuery.status === 'error'
        ? { status: 'error' as const, message: coinsQuery.message }
        : coinsQuery.status === 'empty'
          ? { status: 'empty' as const }
          : coinsQuery.status === 'loading'
            ? { status: 'loading' as const }
            : { status: 'idle' as const };

  const goToStep = (step: OnboardingStep) => {
    setStepError(null);
    setFormError(null);
    setStep(step);
  };

  const handleContinue = () => {
    const validationMessage = validateStep(state.step, state, coinsLoaded);

    if (validationMessage) {
      setStepError(validationMessage);
      return;
    }

    if (state.step < 3) {
      if (state.step === 2) {
        coinsQuery.loadIfNeeded();
      }
      goToStep((state.step + 1) as OnboardingStep);
    }
  };

  const handleBack = () => {
    setStepError(null);
    setFormError(null);

    if (state.step > 1) {
      goToStep((state.step - 1) as OnboardingStep);
    }
  };

  const handleComplete = async () => {
    const step3Validation = validateStep(3, state, coinsLoaded);

    if (step3Validation) {
      setStepError(step3Validation);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setStepError(null);
    setRefreshError(false);

    try {
      const request = buildOnboardingRequest(state);
      await completeOnboarding(request);

      const user = await refreshUser();

      if (!user?.onboardingCompleted) {
        setRefreshError(true);
        return;
      }

      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(mapOnboardingErrorMessage(error.statusCode, error.validationMessages));
        return;
      }

      setFormError('Unable to complete onboarding right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryRefresh = async () => {
    setRefreshError(false);
    setIsSubmitting(true);

    try {
      const user = await refreshUser();

      if (user?.onboardingCompleted) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setRefreshError(true);
    } catch {
      setFormError('Unable to verify your account right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (refreshError) {
    return (
      <AppShell header={<AuthenticatedHeader subtitle="Set up your profile" />}>
        <PageContainer maxWidth="md">
          <ErrorState
            title="Setup saved, but account refresh failed"
            message="Your onboarding was submitted successfully. Retry loading your account to continue to the dashboard."
            actionLabel="Retry"
            onAction={() => {
              void handleRetryRefresh();
            }}
          />
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell header={<AuthenticatedHeader subtitle="Set up your profile" />}>
      <PageContainer maxWidth="md">
        <PageHeader
          title="Personalize your crypto dashboard"
          subtitle="Choose what you want to follow. You can update these preferences later."
        />

        <Card>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <OnboardingProgress currentStep={state.step} />

            {formError ? (
              <Alert severity="error" sx={{ mb: 3 }}>
                {formError}
              </Alert>
            ) : null}

            <Box sx={{ minHeight: 280 }}>
              {state.step === 1 ? (
                <InvestorProfileStep
                  selectedProfile={state.investorProfile}
                  onSelect={setInvestorProfile}
                  error={stepError}
                />
              ) : null}

              {state.step === 2 ? (
                <ContentPreferencesStep
                  preferences={{
                    showMarketPrices: state.showMarketPrices,
                    showNews: state.showNews,
                    showAiInsight: state.showAiInsight,
                    showMeme: state.showMeme,
                  }}
                  onToggle={togglePreference}
                />
              ) : null}

              {state.step === 3 ? (
                <CoinSelectionStep
                  coinsState={coinsState}
                  selectedCoinIds={state.selectedCoinIds}
                  onToggleCoin={toggleCoin}
                  onRetry={coinsQuery.reload}
                  error={stepError}
                />
              ) : null}
            </Box>

            <OnboardingActions
              step={state.step}
              canContinue={canContinue}
              isSubmitting={isSubmitting}
              onBack={handleBack}
              onContinue={handleContinue}
              onComplete={() => {
                void handleComplete();
              }}
            />
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
