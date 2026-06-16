import Grid from '@mui/material/Grid';
import type { DashboardResponse } from './dashboard.types';
import type { DashboardFeedbackController } from './use-dashboard-feedback';
import { InsightSection } from './InsightSection';
import { MarketSection } from './MarketSection';
import { MemeSection } from './MemeSection';
import { NewsSection } from './NewsSection';

interface DashboardGridProps {
  dashboard: DashboardResponse;
  feedback: DashboardFeedbackController;
}

export function DashboardGrid({ dashboard, feedback }: DashboardGridProps) {
  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <NewsSection section={dashboard.news} feedback={feedback} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <MarketSection section={dashboard.market} feedback={feedback} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <InsightSection section={dashboard.insight} feedback={feedback} />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <MemeSection section={dashboard.meme} feedback={feedback} />
      </Grid>
    </Grid>
  );
}
