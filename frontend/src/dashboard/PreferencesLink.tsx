import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router-dom';

interface PreferencesLinkProps {
  children?: string;
}

export function PreferencesLink({ children = 'Preferences' }: PreferencesLinkProps) {
  return (
    <Link
      component={RouterLink}
      to="/preferences"
      underline="hover"
      color="primary"
      variant="body2"
      sx={{ fontWeight: 600 }}
    >
      {children}
    </Link>
  );
}
