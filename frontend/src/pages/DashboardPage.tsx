import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { AppShell } from '../components/layout/AppShell';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionCard } from '../components/layout/SectionCard';
import { LoadingState } from '../components/states/LoadingState';
import { useAuth } from '../auth/auth-context';

const dashboardSections = [
  { title: 'Market News', icon: <ArticleOutlinedIcon /> },
  { title: 'Coin Prices', icon: <ShowChartOutlinedIcon /> },
  { title: 'AI Insight of the Day', icon: <AutoAwesomeOutlinedIcon /> },
  { title: 'Fun Crypto Meme', icon: <EmojiEmotionsOutlinedIcon /> },
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppShell header={<AuthenticatedHeader />}>
      <PageContainer maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h1">
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Signed in as {user?.name ?? 'your account'}. Market and news content will load here in
            a later stage.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {dashboardSections.map((section) => (
            <Grid key={section.title} size={{ xs: 12, md: 6 }}>
              <SectionCard title={section.title} icon={section.icon}>
                <LoadingState message="Dashboard content will load here" minHeight={200} />
              </SectionCard>
            </Grid>
          ))}
        </Grid>
      </PageContainer>
    </AppShell>
  );
}
