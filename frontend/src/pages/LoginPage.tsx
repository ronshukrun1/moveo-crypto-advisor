import { useState, type FormEvent } from 'react';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/api-error';
import {
  hasFieldErrors,
  validateLoginForm,
  type LoginFieldErrors,
  type LoginFormValues,
} from '../auth/auth-validation';
import { useAuth } from '../auth/auth-context';
import { getPostLoginPath } from '../auth/routing';
import { AppShell } from '../components/layout/AppShell';
import { PageContainer } from '../components/layout/PageContainer';
import { PublicHeader } from '../components/layout/PublicHeader';
import { AppTextField } from '../components/common/AppTextField';
import { PasswordTextField } from '../components/common/PasswordTextField';
import { PrimaryButton } from '../components/common/PrimaryButton';

interface LoginLocationState {
  from?: string;
  registrationSuccess?: boolean;
  sessionExpired?: boolean;
}

const initialValues: LoginFormValues = {
  email: '',
  password: '',
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LoginLocationState | null) ?? {};
  const { login } = useAuth();

  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateLoginForm(values);
    setFieldErrors(validationErrors);

    if (hasFieldErrors(validationErrors)) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const user = await login({
        email: values.email,
        password: values.password,
      });

      navigate(getPostLoginPath(user, locationState.from), { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 401) {
          setFormError('Invalid email or password');
          return;
        }

        if (error.statusCode === 400 && error.validationMessages?.length) {
          setFormError('Please check the highlighted fields');
          return;
        }

        if (!error.statusCode) {
          setFormError('The service is currently unavailable');
          return;
        }
      }

      setFormError('The service is currently unavailable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidationErrors = hasFieldErrors(fieldErrors);

  return (
    <AppShell header={<PublicHeader />}>
      <PageContainer maxWidth="sm">
        <Box sx={{ py: { xs: 4, md: 6 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              aria-hidden
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <LoginOutlinedIcon />
            </Box>
            <Typography component="h1" variant="pageTitle">
              Welcome back
            </Typography>
            <Typography variant="muted" sx={{ mt: 1 }}>
              Sign in to your account
            </Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              {locationState.registrationSuccess ? (
                <Alert severity="success" sx={{ mb: 2.5 }}>
                  Account created successfully. You can now sign in.
                </Alert>
              ) : null}

              {locationState.sessionExpired ? (
                <Alert severity="warning" sx={{ mb: 2.5 }}>
                  Your session has expired. Please sign in again.
                </Alert>
              ) : null}

              {formError ? (
                <Alert severity="error" sx={{ mb: 2.5 }}>
                  {formError}
                </Alert>
              ) : null}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <AppTextField
                  label="Email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  startIcon={<EmailOutlinedIcon fontSize="small" />}
                />
                <PasswordTextField
                  label="Password"
                  name="password"
                  value={values.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password}
                />
                <PrimaryButton
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting || hasValidationErrors}
                  sx={{ mt: 1, width: '100%' }}
                >
                  Sign in
                </PrimaryButton>
              </Box>
            </CardContent>
          </Card>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
            Don&apos;t have an account?{' '}
            <Box
              component={RouterLink}
              to="/register"
              sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
            >
              Create one
            </Box>
          </Typography>
        </Box>
      </PageContainer>
    </AppShell>
  );
}
