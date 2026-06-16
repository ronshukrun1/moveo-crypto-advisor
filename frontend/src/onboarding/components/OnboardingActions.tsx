import Box from '@mui/material/Box';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import type { OnboardingStep } from '../../types/onboarding';

interface OnboardingActionsProps {
  step: OnboardingStep;
  canContinue: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onContinue: () => void;
  onComplete: () => void;
}

export function OnboardingActions({
  step,
  canContinue,
  isSubmitting,
  onBack,
  onContinue,
  onComplete,
}: OnboardingActionsProps) {
  const isFinalStep = step === 3;

  return (
    <Box
      sx={{
        mt: 4,
        pt: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      {step > 1 ? (
        <SecondaryButton onClick={onBack} disabled={isSubmitting} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Back
        </SecondaryButton>
      ) : (
        <Box sx={{ display: { xs: 'none', sm: 'block' } }} />
      )}

      <PrimaryButton
        showArrow={!isFinalStep}
        loading={isSubmitting}
        disabled={!canContinue || isSubmitting}
        onClick={isFinalStep ? onComplete : onContinue}
        sx={{ width: { xs: '100%', sm: 'auto' }, ml: { sm: 'auto' } }}
      >
        {isFinalStep ? 'Complete Setup' : 'Continue'}
      </PrimaryButton>
    </Box>
  );
}
