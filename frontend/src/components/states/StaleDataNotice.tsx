import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface StaleDataNoticeProps {
  message?: string;
}

export function StaleDataNotice({
  message = 'Showing the latest available data',
}: StaleDataNoticeProps) {
  return (
    <Box
      role="status"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'warning.main',
        bgcolor: 'rgba(210, 153, 34, 0.08)',
        color: 'warning.main',
      }}
    >
      <InfoOutlinedIcon sx={{ fontSize: 16 }} aria-hidden />
      <Typography variant="metadata" sx={{ color: 'warning.main', fontWeight: 600 }}>
        {message}
      </Typography>
    </Box>
  );
}
