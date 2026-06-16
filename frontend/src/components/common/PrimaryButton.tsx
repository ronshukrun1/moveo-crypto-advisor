import type { ButtonProps } from '@mui/material/Button';
import Button from '@mui/material/Button';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

type PrimaryButtonProps = ButtonProps & {
  showArrow?: boolean;
};

export function PrimaryButton({
  children,
  showArrow = false,
  endIcon,
  ...props
}: PrimaryButtonProps) {
  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      endIcon={showArrow ? endIcon ?? <ChevronRightRoundedIcon /> : endIcon}
      {...props}
    >
      {children}
    </Button>
  );
}
