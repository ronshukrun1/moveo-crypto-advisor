import type { PaletteOptions } from '@mui/material/styles';

export const palette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: '#43D6C8',
    light: '#6DE4D9',
    dark: '#2BA89D',
    contrastText: '#080B10',
  },
  secondary: {
    main: '#8B9CB3',
    contrastText: '#F0F6FC',
  },
  background: {
    default: '#080B10',
    paper: '#11161D',
  },
  text: {
    primary: '#F0F6FC',
    secondary: '#8B9CB3',
  },
  success: {
    main: '#3FB950',
  },
  error: {
    main: '#F85149',
  },
  warning: {
    main: '#D29922',
  },
  divider: 'rgba(139, 156, 179, 0.15)',
};
