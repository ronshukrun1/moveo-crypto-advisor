import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { AppShell } from '../components/layout/AppShell';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { SelectableCard } from '../components/common/SelectableCard';

const placeholderCoins = [
  { title: 'BTC', description: 'Bitcoin' },
  { title: 'ETH', description: 'Ethereum' },
  { title: 'SOL', description: 'Solana' },
  { title: 'ADA', description: 'Cardano' },
];

export function OnboardingPage() {
  return (
    <AppShell header={<AuthenticatedHeader subtitle="Set up your profile" />}>
      <PageContainer maxWidth="md">
        <PageHeader
          title="Personalize your dashboard"
          subtitle="Select your preferences below. You can update these anytime."
        />

        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="metadata">Setup progress</Typography>
            <Typography variant="metadata">Step 1 of 3</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={33}
            sx={{
              height: 6,
              borderRadius: 999,
              bgcolor: 'rgba(139, 156, 179, 0.12)',
              '& .MuiLinearProgress-bar': { borderRadius: 999 },
            }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="sectionTitle" component="h2" sx={{ mb: 2 }}>
            Assets to track
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              gap: 2,
            }}
          >
            {placeholderCoins.map((coin, index) => (
              <SelectableCard
                key={coin.title}
                title={coin.title}
                description={coin.description}
                selected={index < 2}
                disabled
              />
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Complete all steps to launch your dashboard
          </Typography>
          <Box
            component="button"
            disabled
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 999,
              border: 'none',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontWeight: 600,
              opacity: 0.5,
              cursor: 'not-allowed',
            }}
          >
            Launch Dashboard
          </Box>
        </Box>
      </PageContainer>
    </AppShell>
  );
}
