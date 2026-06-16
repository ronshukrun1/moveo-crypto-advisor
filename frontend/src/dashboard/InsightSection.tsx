import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SectionCard } from '../components/layout/SectionCard';
import { SectionState } from '../components/states/SectionState';
import { DASHBOARD_SECTION_COPY } from './constants';
import { DisabledSectionContent } from './DisabledSectionContent';
import type { DashboardInsightSection } from './dashboard.types';
import { FeedbackControls } from './FeedbackControls';
import type { DashboardFeedbackController } from './use-dashboard-feedback';
import { formatIsoDateTime } from '../utils/formatting';

interface InsightSectionProps {
  section: DashboardInsightSection;
  feedback: DashboardFeedbackController;
}

export function InsightSection({ section, feedback }: InsightSectionProps) {
  return (
    <SectionCard title="AI Insight of the Day" icon={<AutoAwesomeOutlinedIcon />}>
      {section.status === 'disabled' ? (
        <DisabledSectionContent message={DASHBOARD_SECTION_COPY.insight.disabled} />
      ) : (
        <SectionState
          status={section.status}
          unavailableMessage={DASHBOARD_SECTION_COPY.insight.unavailable}
        >
          {section.data ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="h6" component="h3">
                {section.data.title}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {section.data.insight}
              </Typography>
              <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                {section.data.disclaimer}
              </Typography>
              <Typography variant="metadata" color="text.secondary">
                Generated {formatIsoDateTime(section.data.generatedAt)}
              </Typography>
              <FeedbackControls
                currentVote={feedback.getVote(
                  'INSIGHT',
                  section.data.feedbackContentId,
                )}
                disabled={feedback.isSaving(
                  'INSIGHT',
                  section.data.feedbackContentId,
                )}
                error={feedback.getError(
                  'INSIGHT',
                  section.data.feedbackContentId,
                )}
                onVote={(feedbackType) => {
                  void feedback.vote(
                    'INSIGHT',
                    section.data!.feedbackContentId,
                    feedbackType,
                  );
                }}
              />
            </Box>
          ) : null}
        </SectionState>
      )}
    </SectionCard>
  );
}
