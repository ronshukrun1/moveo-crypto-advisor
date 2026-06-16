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

interface NewsSectionProps {
  section: DashboardNewsSection;
}

export function NewsSection({ section }: NewsSectionProps) {
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
            <Box>
              {section.items.map((item) => (
                <NewsItem key={item.id} item={item} />
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
