import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import type { TextFieldProps } from '@mui/material/TextField';
import { AppTextField } from './AppTextField';

export function PasswordTextField(props: TextFieldProps) {
  return (
    <AppTextField
      type="password"
      autoComplete={props.autoComplete ?? 'current-password'}
      startIcon={<LockOutlinedIcon fontSize="small" />}
      {...props}
    />
  );
}
