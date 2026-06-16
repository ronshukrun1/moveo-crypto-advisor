import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { FeedbackType } from '../types/feedback';

interface FeedbackControlsProps {
  currentVote: FeedbackType | null;
  disabled?: boolean;
  error?: string | null;
  onVote: (feedbackType: FeedbackType) => void;
}

export function FeedbackControls({
  currentVote,
  disabled = false,
  error,
  onVote,
}: FeedbackControlsProps) {
  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography variant="metadata" color="text.secondary" sx={{ mb: 0.75 }}>
        Was this useful?
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <IconButton
          aria-label="Mark as helpful"
          aria-pressed={currentVote === 'UP'}
          disabled={disabled}
          onClick={() => onVote('UP')}
          color={currentVote === 'UP' ? 'primary' : 'default'}
          sx={{
            border: '1px solid',
            borderColor: currentVote === 'UP' ? 'primary.main' : 'divider',
          }}
        >
          <ThumbUpOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton
          aria-label="Mark as not helpful"
          aria-pressed={currentVote === 'DOWN'}
          disabled={disabled}
          onClick={() => onVote('DOWN')}
          color={currentVote === 'DOWN' ? 'primary' : 'default'}
          sx={{
            border: '1px solid',
            borderColor: currentVote === 'DOWN' ? 'primary.main' : 'divider',
          }}
        >
          <ThumbDownOutlinedIcon fontSize="small" />
        </IconButton>
      </Box>
      {error ? (
        <Typography variant="body2" color="error.main" role="alert" sx={{ mt: 1 }}>
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}
