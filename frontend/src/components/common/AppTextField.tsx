import type { TextFieldProps } from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type AppTextFieldProps = TextFieldProps & {
  startIcon?: ReactNode;
};

export function AppTextField({ label, startIcon, id, ...props }: AppTextFieldProps) {
  const fieldId = id ?? (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <Box>
      {label ? (
        <Typography component="label" htmlFor={fieldId} variant="label" sx={{ display: 'block', mb: 1 }}>
          {label}
        </Typography>
      ) : null}
      <TextField
        id={fieldId}
        slotProps={
          startIcon
            ? {
                input: {
                  startAdornment: (
                    <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                      {startIcon}
                    </InputAdornment>
                  ),
                },
              }
            : undefined
        }
        {...props}
      />
    </Box>
  );
}
