import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import Box from '@mui/material/Box';
import { SectionCard } from '../components/layout/SectionCard';
import { EmptyState } from '../components/states/EmptyState';
import { SectionState } from '../components/states/SectionState';
import { StaleDataNotice } from '../components/states/StaleDataNotice';
import { DASHBOARD_SECTION_COPY } from './constants';
import { DisabledSectionContent } from './DisabledSectionContent';
import { NewsItem } from './NewsItem';
import type { DashboardNewsSection } from './dashboard.types';
import type { DashboardFeedbackController } from './use-dashboard-feedback';

interface NewsSectionProps {
  section: DashboardNewsSection;
  feedback: DashboardFeedbackController;
}

export function NewsSection({ section, feedback }: NewsSectionProps) {
  const staleNotice = section.isStale ? (
    <Box sx={{ mb: 2 }}>
      <StaleDataNotice message={DASHBOARD_SECTION_COPY.news.stale} />
    </Box>
  ) : null;

  return (
    <SectionCard title="Market News" icon={<ArticleOutlinedIcon />}>
      {section.status === 'disabled' ? (
        <DisabledSectionContent message={DASHBOARD_SECTION_COPY.news.disabled} />
      ) : (
        <SectionState
          status={section.status}
          unavailableMessage={DASHBOARD_SECTION_COPY.news.unavailable}
        >
          {staleNotice}
          {section.items && section.items.length > 0 ? (
            <Box
              sx={{
                maxHeight: { md: 520 },
                overflowY: { md: 'auto' },
                overflowX: 'hidden',
              }}
            >
              {section.items.map((item) => (
                <NewsItem key={item.id} item={item} feedback={feedback} />
              ))}
            </Box>
          ) : (
            <EmptyState message={DASHBOARD_SECTION_COPY.news.empty} />
          )}
        </SectionState>
      )}
    </SectionCard>
  );
}
