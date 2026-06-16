import type { TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type AppTextFieldProps = TextFieldProps & {
  startIcon?: ReactNode;
};

export function AppTextField({
  label,
  startIcon,
  id,
  slotProps,
  ...props
}: AppTextFieldProps) {
  const fieldId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const inputSlotProps = {
    ...(slotProps?.input ?? {}),
    ...(startIcon
      ? {
          startAdornment: (
            <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
              {startIcon}
            </InputAdornment>
          ),
        }
      : {}),
  };

  return (
    <Box>
      {label ? (
        <Typography component="label" htmlFor={fieldId} variant="label" sx={{ display: 'block', mb: 1 }}>
          {label}
        </Typography>
      ) : null}
      <TextField
        id={fieldId}
        slotProps={{
          ...slotProps,
          input: Object.keys(inputSlotProps).length > 0 ? inputSlotProps : slotProps?.input,
        }}
        {...props}
      />
    </Box>
  );
}
