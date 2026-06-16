import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SelectableCard } from '../../components/common/SelectableCard';
import { CONTENT_PREFERENCE_OPTIONS } from '../constants';
import type { ContentPreferences } from '../../types/onboarding';

interface ContentPreferencesStepProps {
  preferences: ContentPreferences;
  onToggle: (key: keyof ContentPreferences) => void;
}

export function ContentPreferencesStep({
  preferences,
  onToggle,
}: ContentPreferencesStepProps) {
  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
        }}
      >
        {CONTENT_PREFERENCE_OPTIONS.map((option) => (
          <Box key={option.key}>
            <SelectableCard
              title={option.label}
              description={option.description}
              icon={option.icon}
              selected={preferences[option.key]}
              onClick={() => onToggle(option.key)}
            />
            {option.disclaimer ? (
              <Typography variant="metadata" sx={{ mt: 1, display: 'block', px: 0.5 }}>
                {option.disclaimer}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
