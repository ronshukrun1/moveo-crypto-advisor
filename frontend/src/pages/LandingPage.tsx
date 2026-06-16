import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PageContainer } from '../components/layout/PageContainer';
import { PublicHeader } from '../components/layout/PublicHeader';
import { PrimaryButton } from '../components/common/PrimaryButton';
import { SecondaryButton } from '../components/common/SecondaryButton';
import { ApiStatusIndicator } from '../components/states/ApiStatusIndicator';

const featureCards = [
  {
    icon: <ShowChartOutlinedIcon />,
    title: 'Real-Time Market Data',
    description: 'Track prices for the coins you select, updated from live market sources.',
  },
  {
    icon: <AutoAwesomeOutlinedIcon />,
    title: 'AI-Powered Insights',
    description: 'Receive daily educational market context tailored to your profile.',
  },
  {
    icon: <BoltOutlinedIcon />,
    title: 'Personalized Dashboard',
    description: 'See news, prices, insights, and memes in one place based on your preferences.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <AppShell
      header={<PublicHeader />}
      footer={
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <ApiStatusIndicator />
        </Box>
      }
    >
      <PageContainer maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            pt: { xs: 6, md: 10 },
            pb: { xs: 6, md: 8 },
          }}
        >
          <Chip
            label="AI-Powered Crypto Intelligence"
            variant="outlined"
            icon={
              <Box
                aria-hidden
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  ml: 1,
                }}
              />
            }
            sx={{
              mb: 3,
              borderColor: 'primary.main',
              color: 'primary.main',
              fontWeight: 600,
              '& .MuiChip-icon': { ml: 1 },
            }}
          />

          <Typography
            component="h1"
            variant="heroTitle"
            sx={{
              maxWidth: 760,
              fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
            }}
          >
            Your Personal{' '}
            <Box component="span" sx={{ color: 'primary.main' }}>
              Crypto Advisor
            </Box>
          </Typography>

          <Typography
            variant="muted"
            sx={{ mt: 2, maxWidth: 620, fontSize: { xs: '1rem', md: '1.125rem' } }}
          >
            Get daily AI-curated market insights, real-time prices, and personalized content
            based on your investment style.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mt: 4,
              width: { xs: '100%', sm: 'auto' },
            }}
          >
          <PrimaryButton
            showArrow
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            onClick={() => navigate('/register')}
          >
            Start Free
          </PrimaryButton>
          <SecondaryButton
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            onClick={() => navigate('/login')}
          >
            Sign In
          </SecondaryButton>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ pb: 6 }}>
          {featureCards.map((feature) => (
            <Grid key={feature.title} size={{ xs: 12, md: 4 }}>
              <Box
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(67, 214, 200, 0.1)',
                    color: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </PageContainer>
    </AppShell>
  );
}
