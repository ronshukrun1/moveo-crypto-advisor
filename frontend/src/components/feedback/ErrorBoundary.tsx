import { Component, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import { ErrorState } from '../states/ErrorState';
import { AppShell } from '../layout/AppShell';
import { PublicHeader } from '../layout/PublicHeader';
import { PageContainer } from '../layout/PageContainer';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Intentionally avoid logging sensitive details to the console in production UI flows.
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <AppShell header={<PublicHeader />}>
          <PageContainer maxWidth="sm">
            <Box sx={{ py: 8 }}>
              <ErrorState
                title="Unexpected error"
                message="Something went wrong while loading this page. Please try again."
                actionLabel="Return home"
                onAction={this.handleRetry}
              />
            </Box>
          </PageContainer>
        </AppShell>
      );
    }

    return this.props.children;
  }
}
