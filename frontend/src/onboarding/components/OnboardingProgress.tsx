import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { ONBOARDING_STEP_LABELS } from '../constants';
import type { OnboardingStep } from '../../types/onboarding';

interface OnboardingProgressProps {
  currentStep: OnboardingStep;
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  const progressValue = (currentStep / ONBOARDING_STEP_LABELS.length) * 100;

  return (
    <Box sx={{ mb: 4 }} aria-label={`Onboarding step ${currentStep} of ${ONBOARDING_STEP_LABELS.length}`}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="metadata">Setup progress</Typography>
        <Typography variant="metadata">
          Step {currentStep} of {ONBOARDING_STEP_LABELS.length}
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progressValue}
        aria-hidden
        sx={{
          height: 6,
          borderRadius: 999,
          bgcolor: 'rgba(139, 156, 179, 0.12)',
          '& .MuiLinearProgress-bar': { borderRadius: 999 },
        }}
      />
      <Typography variant="h6" component="h2" sx={{ mt: 2, textTransform: 'capitalize' }}>
        {ONBOARDING_STEP_LABELS[currentStep - 1]}
      </Typography>
    </Box>
  );
}
