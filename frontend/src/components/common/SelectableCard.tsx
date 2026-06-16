import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

interface SelectableCardProps {
  title: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
}

export function SelectableCard({
  title,
  description,
  selected = false,
  disabled = false,
  onClick,
  icon,
}: SelectableCardProps) {
  const isInteractive = Boolean(onClick) && !disabled;

  return (
    <Box
      component={isInteractive ? 'button' : 'div'}
      type={isInteractive ? 'button' : undefined}
      onClick={disabled ? undefined : onClick}
      aria-pressed={isInteractive ? selected : undefined}
      aria-disabled={disabled || undefined}
      sx={{
        position: 'relative',
        width: '100%',
        textAlign: 'left',
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'rgba(67, 214, 200, 0.06)' : 'background.paper',
        color: 'text.primary',
        cursor: disabled ? 'not-allowed' : isInteractive ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
        '&:hover': isInteractive
          ? {
              borderColor: selected ? 'primary.main' : 'rgba(139, 156, 179, 0.35)',
              bgcolor: selected ? 'rgba(67, 214, 200, 0.08)' : 'rgba(139, 156, 179, 0.04)',
            }
          : undefined,
        '&:focus-visible': isInteractive
          ? {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            }
          : undefined,
      }}
    >
      {selected ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckRoundedIcon sx={{ fontSize: 14 }} />
        </Box>
      ) : null}

      {icon ? <Box sx={{ mb: 1.5, color: 'primary.main' }}>{icon}</Box> : null}

      <Typography variant="cardTitle" component="div">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      ) : null}
    </Box>
  );
}
