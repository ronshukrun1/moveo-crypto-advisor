import { createTheme } from '@mui/material/styles';
import { componentOverrides } from './component-overrides';
import { palette } from './palette';
import { typography } from './typography';

export const appTheme = createTheme({
  palette,
  typography,
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: componentOverrides,
});
