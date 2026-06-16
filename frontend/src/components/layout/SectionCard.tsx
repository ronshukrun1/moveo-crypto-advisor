import type { ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  minHeight?: number | string;
}

export function SectionCard({
  title,
  icon,
  action,
  children,
  minHeight = 280,
}: SectionCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            {icon ? <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box> : null}
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
          </Box>
          {action}
        </Box>
        <Box sx={{ flex: 1, minHeight }}>{children}</Box>
      </CardContent>
    </Card>
  );
}
