import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { SectionCard } from '../components/layout/SectionCard';

function SectionSkeleton() {
  return (
    <SectionCard title="Loading">
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Skeleton variant="rounded" height={88} />
        <Skeleton variant="rounded" height={88} />
        <Skeleton variant="rounded" height={88} />
        <Skeleton variant="rounded" height={88} />
      </Box>
    </SectionCard>
  );
}

export function PreferencesSkeleton() {
  return (
    <Box
      aria-label="Loading preferences"
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Skeleton variant="rounded" width={180} height={48} />
        <Skeleton variant="rounded" width={180} height={48} />
      </Box>
    </Box>
  );
}
