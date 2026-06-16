import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined';
import Box from '@mui/material/Box';
import { SectionCard } from '../components/layout/SectionCard';
import { EmptyState } from '../components/states/EmptyState';
import { SectionState } from '../components/states/SectionState';
import { StaleDataNotice } from '../components/states/StaleDataNotice';
import { DASHBOARD_SECTION_COPY } from './constants';
import { DisabledSectionContent } from './DisabledSectionContent';
import { MarketItem } from './MarketItem';
import type { DashboardMarketSection } from './dashboard.types';

interface MarketSectionProps {
  section: DashboardMarketSection;
}

export function MarketSection({ section }: MarketSectionProps) {
  const staleNotice = section.isStale ? (
    <Box sx={{ mb: 2 }}>
      <StaleDataNotice message={DASHBOARD_SECTION_COPY.market.stale} />
    </Box>
  ) : null;

  return (
    <SectionCard title="Coin Prices" icon={<ShowChartOutlinedIcon />}>
      {section.status === 'disabled' ? (
        <DisabledSectionContent message={DASHBOARD_SECTION_COPY.market.disabled} />
      ) : (
        <SectionState
          status={section.status}
          unavailableMessage={DASHBOARD_SECTION_COPY.market.unavailable}
        >
          {staleNotice}
          {section.items && section.items.length > 0 ? (
            <Box>
              {section.items.map((item) => (
                <MarketItem key={item.id} item={item} />
              ))}
            </Box>
          ) : (
            <EmptyState message={DASHBOARD_SECTION_COPY.market.empty} />
          )}
        </SectionState>
      )}
    </SectionCard>
  );
}
