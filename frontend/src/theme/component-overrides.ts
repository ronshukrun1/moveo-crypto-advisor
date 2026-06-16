import type { Components, Theme } from '@mui/material/styles';

export const componentOverrides: Components<Theme> = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: '#080B10',
        minHeight: '100vh',
      },
      '#root': {
        minHeight: '100vh',
      },
      '::selection': {
        backgroundColor: 'rgba(67, 214, 200, 0.35)',
        color: '#F0F6FC',
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 999,
        textTransform: 'none',
        fontWeight: 600,
        paddingInline: 24,
        paddingBlock: 10,
      },
      sizeLarge: {
        paddingInline: 32,
        paddingBlock: 12,
        fontSize: '1rem',
      },
      outlined: {
        borderColor: 'rgba(139, 156, 179, 0.35)',
        color: '#F0F6FC',
        '&:hover': {
          borderColor: 'rgba(139, 156, 179, 0.55)',
          backgroundColor: 'rgba(139, 156, 179, 0.06)',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: '1px solid rgba(139, 156, 179, 0.15)',
        backgroundImage: 'none',
        boxShadow: 'none',
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      fullWidth: true,
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundColor: '#0D1117',
        '& fieldset': {
          borderColor: 'rgba(139, 156, 179, 0.2)',
        },
        '&:hover fieldset': {
          borderColor: 'rgba(139, 156, 179, 0.35)',
        },
        '&.Mui-focused fieldset': {
          borderColor: '#43D6C8',
        },
        '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active':
          {
            WebkitBoxShadow: '0 0 0 1000px #0D1117 inset',
            WebkitTextFillColor: '#F0F6FC',
            caretColor: '#F0F6FC',
            transition: 'background-color 5000s ease-in-out 0s',
          },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        marginBottom: 4,
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: 'rgba(139, 156, 179, 0.15)',
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        '&:hover': {
          backgroundColor: 'rgba(139, 156, 179, 0.08)',
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        border: '1px solid rgba(139, 156, 179, 0.15)',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 600,
      },
    },
  },
};
