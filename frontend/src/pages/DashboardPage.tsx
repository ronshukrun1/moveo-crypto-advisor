import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import { AppShell } from '../components/layout/AppShell';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionCard } from '../components/layout/SectionCard';
import { LoadingState } from '../components/states/LoadingState';

const dashboardSections = [
  { title: 'Market News', icon: <ArticleOutlinedIcon /> },
  { title: 'Coin Prices', icon: <ShowChartOutlinedIcon /> },
  { title: 'AI Insight of the Day', icon: <AutoAwesomeOutlinedIcon /> },
  { title: 'Fun Crypto Meme', icon: <EmojiEmotionsOutlinedIcon /> },
];

function SectionSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Skeleton variant="rounded" height={20} width="70%" />
      <Skeleton variant="rounded" height={14} width="100%" />
      <Skeleton variant="rounded" height={14} width="90%" />
      <Skeleton variant="rounded" height={14} width="80%" sx={{ mt: 1 }} />
    </Box>
  );
}

export function DashboardPage() {
  return (
    <AppShell header={<AuthenticatedHeader />}>
      <PageContainer maxWidth="xl">
        <Grid container spacing={3}>
          {dashboardSections.map((section) => (
            <Grid key={section.title} size={{ xs: 12, md: 6 }}>
              <SectionCard title={section.title} icon={section.icon}>
                <LoadingState message="Dashboard content will load here" minHeight={200} />
                <Box sx={{ display: 'none' }} aria-hidden>
                  <SectionSkeleton />
                </Box>
              </SectionCard>
            </Grid>
          ))}
        </Grid>
      </PageContainer>
    </AppShell>
  );
}
