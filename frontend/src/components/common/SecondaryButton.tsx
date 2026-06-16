import type { ButtonProps } from '@mui/material/Button';
import Button from '@mui/material/Button';

export function SecondaryButton({ children, ...props }: ButtonProps) {
  return (
    <Button variant="outlined" color="inherit" size="large" {...props}>
      {children}
    </Button>
  );
}
