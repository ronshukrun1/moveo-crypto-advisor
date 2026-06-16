import type { ButtonProps } from '@mui/material/Button';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

type PrimaryButtonProps = ButtonProps & {
  showArrow?: boolean;
  loading?: boolean;
};

export function PrimaryButton({
  children,
  showArrow = false,
  loading = false,
  disabled,
  endIcon,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      disabled={disabled || loading}
      endIcon={
        loading ? undefined : showArrow ? (endIcon ?? <ChevronRightRoundedIcon />) : endIcon
      }
      {...props}
    >
      {loading ? <CircularProgress size={22} color="inherit" aria-label="Loading" /> : children}
    </Button>
  );
}
