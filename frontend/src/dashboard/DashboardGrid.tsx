import Grid from '@mui/material/Grid';
import type { DashboardResponse } from './dashboard.types';
import { InsightSection } from './InsightSection';
import { MarketSection } from './MarketSection';
import { MemeSection } from './MemeSection';
import { NewsSection } from './NewsSection';

interface DashboardGridProps {
  dashboard: DashboardResponse;
}

export function DashboardGrid({ dashboard }: DashboardGridProps) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <NewsSection section={dashboard.news} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <MarketSection section={dashboard.market} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <InsightSection section={dashboard.insight} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <MemeSection section={dashboard.meme} />
      </Grid>
    </Grid>
  );
}
