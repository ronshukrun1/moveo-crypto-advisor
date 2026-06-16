import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';

export type StatusBadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'primary';

interface StatusBadgeProps extends Omit<ChipProps, 'color' | 'variant'> {
  variant?: StatusBadgeVariant;
}

const colorMap: Record<StatusBadgeVariant, ChipProps['color']> = {
  default: 'default',
  success: 'success',
  error: 'error',
  warning: 'warning',
  primary: 'primary',
};

export function StatusBadge({ variant = 'default', size = 'small', ...props }: StatusBadgeProps) {
  return (
    <Chip
      size={size}
      color={colorMap[variant]}
      variant="outlined"
      sx={{
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontSize: '0.7rem',
      }}
      {...props}
    />
  );
}
