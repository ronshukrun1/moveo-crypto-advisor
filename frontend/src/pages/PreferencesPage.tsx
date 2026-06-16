import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { AppShell } from '../components/layout/AppShell';
import { AuthenticatedHeader } from '../components/layout/AuthenticatedHeader';
import { PageContainer, PageHeader } from '../components/layout/PageContainer';
import { SelectableCard } from '../components/common/SelectableCard';

const profileOptions = [
  { title: 'Beginner', description: 'New to crypto markets' },
  { title: 'Long-term holder', description: 'Focused on accumulation' },
  { title: 'Active trader', description: 'Short-term market activity' },
  { title: 'Crypto enthusiast', description: 'Broad market interest' },
];

const contentSections = [
  { title: 'Market News', description: 'Personalized headlines' },
  { title: 'Coin Prices', description: 'Selected coin prices' },
  { title: 'AI Insight', description: 'Daily educational insight' },
  { title: 'Crypto Meme', description: 'Lighthearted daily meme' },
];

export function PreferencesPage() {
  return (
    <AppShell header={<AuthenticatedHeader subtitle="Preferences" />}>
      <PageContainer maxWidth="md">
        <PageHeader
          title="Content preferences"
          subtitle="Control what appears on your dashboard and how content is tailored."
        />

        <Box sx={{ mb: 4 }}>
          <Typography variant="sectionTitle" component="h2" sx={{ mb: 2 }}>
            Investor profile
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            {profileOptions.map((option, index) => (
              <SelectableCard
                key={option.title}
                title={option.title}
                description={option.description}
                selected={index === 0}
                disabled
              />
            ))}
          </Box>
        </Box>

        <Box>
          <Typography variant="sectionTitle" component="h2" sx={{ mb: 2 }}>
            Dashboard sections
          </Typography>
          <Card>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {contentSections.map((section, index) => (
                <SelectableCard
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  selected={index < 3}
                  disabled
                />
              ))}
            </CardContent>
          </Card>
        </Box>
      </PageContainer>
    </AppShell>
  );
}
