import type { TypographyVariantsOptions } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    heroTitle: React.CSSProperties;
    pageTitle: React.CSSProperties;
    sectionTitle: React.CSSProperties;
    cardTitle: React.CSSProperties;
    muted: React.CSSProperties;
    label: React.CSSProperties;
    metadata: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    heroTitle?: React.CSSProperties;
    pageTitle?: React.CSSProperties;
    sectionTitle?: React.CSSProperties;
    cardTitle?: React.CSSProperties;
    muted?: React.CSSProperties;
    label?: React.CSSProperties;
    metadata?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    heroTitle: true;
    pageTitle: true;
    sectionTitle: true;
    cardTitle: true;
    muted: true;
    label: true;
    metadata: true;
  }
}

const fontFamily = [
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  'sans-serif',
].join(',');

export const typography: TypographyVariantsOptions = {
  fontFamily,
  h1: {
    fontSize: '3rem',
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.35,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.45,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.55,
  },
  heroTitle: {
    fontSize: '3.5rem',
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
  },
  pageTitle: {
    fontSize: '2.25rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  sectionTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  muted: {
    fontSize: '1rem',
    lineHeight: 1.6,
    color: '#8B9CB3',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  metadata: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    color: '#8B9CB3',
  },
};
