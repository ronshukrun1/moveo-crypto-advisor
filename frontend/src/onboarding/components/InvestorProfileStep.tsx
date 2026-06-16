import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SelectableCard } from '../../components/common/SelectableCard';
import { INVESTOR_PROFILE_OPTIONS } from '../constants';
import type { InvestorProfile } from '../../types/onboarding';

interface InvestorProfileStepProps {
  selectedProfile: InvestorProfile | null;
  onSelect: (profile: InvestorProfile) => void;
  error?: string | null;
}

export function InvestorProfileStep({
  selectedProfile,
  onSelect,
  error,
}: InvestorProfileStepProps) {
  return (
    <Box>
      {error ? (
        <Typography variant="body2" color="error.main" role="alert" sx={{ mb: 2 }}>
          {error}
        </Typography>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {INVESTOR_PROFILE_OPTIONS.map((option) => (
          <SelectableCard
            key={option.value}
            title={option.label}
            description={option.description}
            icon={option.icon}
            selected={selectedProfile === option.value}
            onClick={() => onSelect(option.value)}
          />
        ))}
      </Box>
    </Box>
  );
}
