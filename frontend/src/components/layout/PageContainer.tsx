import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import type { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  disableGutters?: boolean;
}

export function PageContainer({
  children,
  maxWidth = 'lg',
  disableGutters = false,
}: PageContainerProps) {
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters={disableGutters}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 3, md: 4 },
        width: '100%',
      }}
    >
      {children}
    </Container>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: { xs: 3, md: 4 },
      }}
    >
      <Box>
        <Box component="h1" sx={{ m: 0, typography: 'pageTitle' }}>
          {title}
        </Box>
        {subtitle ? (
          <Box component="p" sx={{ m: 0, mt: 1, typography: 'muted' }}>
            {subtitle}
          </Box>
        ) : null}
      </Box>
      {action}
    </Box>
  );
}
