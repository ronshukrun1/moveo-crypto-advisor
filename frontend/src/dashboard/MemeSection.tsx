import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { SectionCard } from '../components/layout/SectionCard';
import { SectionState } from '../components/states/SectionState';
import { DASHBOARD_SECTION_COPY } from './constants';
import { DisabledSectionContent } from './DisabledSectionContent';
import type { DashboardMemeSection } from './dashboard.types';

interface MemeSectionProps {
  section: DashboardMemeSection;
}

export function MemeSection({ section }: MemeSectionProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <SectionCard title="Fun Crypto Meme" icon={<EmojiEmotionsOutlinedIcon />}>
      {section.status === 'disabled' ? (
        <DisabledSectionContent message={DASHBOARD_SECTION_COPY.meme.disabled} />
      ) : (
        <SectionState
          status={section.status}
          unavailableMessage={DASHBOARD_SECTION_COPY.meme.unavailable}
        >
          {section.data ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                textAlign: 'center',
              }}
            >
              {imageFailed ? (
                <Box
                  role="img"
                  aria-label={`Meme: ${section.data.textTop}. ${section.data.textBottom}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                    width: '100%',
                    minHeight: 180,
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    px: 2,
                    py: 3,
                  }}
                >
                  <ImageNotSupportedOutlinedIcon color="disabled" />
                  <Typography variant="body2" color="text.secondary">
                    {section.data.textTop}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {section.data.textBottom}
                  </Typography>
                </Box>
              ) : (
                <Box
                  component="img"
                  src={section.data.imageUrl}
                  alt={`Meme: ${section.data.textTop}. ${section.data.textBottom}`}
                  onError={() => setImageFailed(true)}
                  sx={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: 2,
                    objectFit: 'contain',
                  }}
                />
              )}

              {section.data.pageUrl ? (
                <Link
                  href={section.data.pageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  variant="body2"
                >
                  View source
                </Link>
              ) : null}
            </Box>
          ) : null}
        </SectionState>
      )}
    </SectionCard>
  );
}
