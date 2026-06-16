import Box from '@mui/material/Box';
import { DisabledState } from '../components/states/DisabledState';
import { PreferencesLink } from './PreferencesLink';

interface DisabledSectionContentProps {
  message: string;
}

export function DisabledSectionContent({ message }: DisabledSectionContentProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <DisabledState message={message} />
      <PreferencesLink />
    </Box>
  );
}
