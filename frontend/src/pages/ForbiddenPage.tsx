import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PageContainer } from '../components/layout/PageContainer';
import { PublicHeader } from '../components/layout/PublicHeader';
import { ErrorState } from '../components/states/ErrorState';
import { PrimaryButton } from '../components/common/PrimaryButton';

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <AppShell header={<PublicHeader />}>
      <PageContainer maxWidth="sm">
        <ErrorState
          title="Access denied"
          message="You do not have permission to view this page."
          icon={<GppBadOutlinedIcon sx={{ fontSize: 40 }} />}
        />
        <PrimaryButton onClick={() => navigate('/dashboard')} sx={{ display: 'block', mx: 'auto', mb: 6 }}>
          Go to dashboard
        </PrimaryButton>
      </PageContainer>
    </AppShell>
  );
}
