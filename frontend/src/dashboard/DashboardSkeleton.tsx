import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import { SectionCard } from '../components/layout/SectionCard';

function SectionSkeleton() {
  return (
    <SectionCard title="Loading" minHeight={280}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rounded" height={24} width="55%" />
        <Skeleton variant="rounded" height={16} width="90%" />
        <Skeleton variant="rounded" height={16} width="75%" />
        <Skeleton variant="rounded" height={120} />
      </Box>
    </SectionCard>
  );
}

export function DashboardSkeleton() {
  return (
    <Grid container spacing={3} aria-busy="true" aria-label="Loading dashboard">
      {Array.from({ length: 4 }, (_, index) => (
        <Grid key={index} size={{ xs: 12, md: 6 }}>
          <SectionSkeleton />
        </Grid>
      ))}
    </Grid>
  );
}
