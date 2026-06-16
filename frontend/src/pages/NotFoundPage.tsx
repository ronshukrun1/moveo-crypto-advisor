import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PageContainer } from '../components/layout/PageContainer';
import { PublicHeader } from '../components/layout/PublicHeader';
import { ErrorState } from '../components/states/ErrorState';
import { PrimaryButton } from '../components/common/PrimaryButton';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AppShell header={<PublicHeader />}>
      <PageContainer maxWidth="sm">
        <ErrorState
          title="Page not found"
          message="The page you are looking for does not exist or may have been moved."
          icon={<SearchOffOutlinedIcon sx={{ fontSize: 40 }} />}
        />
        <PrimaryButton onClick={() => navigate('/')} sx={{ display: 'block', mx: 'auto', mb: 6 }}>
          Go to home
        </PrimaryButton>
      </PageContainer>
    </AppShell>
  );
}
