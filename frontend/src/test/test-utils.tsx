import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactElement, ReactNode } from 'react';
import { appTheme } from '../theme/theme';
import { AuthProvider } from '../auth/auth-context';

interface TestProvidersProps {
  children: ReactNode;
  routerProps?: MemoryRouterProps;
}

function TestProviders({ children, routerProps }: TestProvidersProps) {
  return (
    <ThemeProvider theme={appTheme}>
      <MemoryRouter {...routerProps}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { routerProps?: MemoryRouterProps },
) {
  const { routerProps, ...renderOptions } = options ?? {};

  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders routerProps={routerProps}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
}
