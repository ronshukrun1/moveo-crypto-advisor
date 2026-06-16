import { useState, type FormEvent } from 'react';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/api-error';
import { registerUser } from '../api/auth';
import {
  hasFieldErrors,
  mapBackendValidationToRegisterFields,
  validateRegisterForm,
  type RegisterFieldErrors,
  type RegisterFormValues,
} from '../auth/auth-validation';
import { AppShell } from '../components/layout/AppShell';
import { PageContainer } from '../components/layout/PageContainer';
import { PublicHeader } from '../components/layout/PublicHeader';
import { AppTextField } from '../components/common/AppTextField';
import { PasswordTextField } from '../components/common/PasswordTextField';
import { PrimaryButton } from '../components/common/PrimaryButton';

const initialValues: RegisterFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function RegisterPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof RegisterFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateRegisterForm(values);
    setFieldErrors(validationErrors);

    if (hasFieldErrors(validationErrors)) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
      });

      navigate('/login', {
        replace: true,
        state: { registrationSuccess: true },
      });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 409) {
          setFormError('An account with this email already exists');
          return;
        }

        if (error.statusCode === 400 && error.validationMessages?.length) {
          const backendFieldErrors = mapBackendValidationToRegisterFields(error.validationMessages);
          setFieldErrors((current) => ({ ...current, ...backendFieldErrors }));
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
              <PersonAddOutlinedIcon />
            </Box>
            <Typography component="h1" variant="pageTitle">
              Create your account
            </Typography>
            <Typography variant="muted" sx={{ mt: 1 }}>
              Sign up to get started
            </Typography>
          </Box>

          <Card>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              {formError ? (
                <Alert severity="error" sx={{ mb: 2.5 }}>
                  {formError}
                </Alert>
              ) : null}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <AppTextField
                  label="Name"
                  name="name"
                  value={values.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  error={Boolean(fieldErrors.name)}
                  helperText={fieldErrors.name}
                  startIcon={<PersonOutlinedIcon fontSize="small" />}
                />
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
                  placeholder="Create a password"
                  autoComplete="new-password"
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password}
                />
                <PasswordTextField
                  label="Confirm Password"
                  name="confirmPassword"
                  value={values.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  error={Boolean(fieldErrors.confirmPassword)}
                  helperText={fieldErrors.confirmPassword}
                />
                <PrimaryButton
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting || hasValidationErrors}
                  sx={{ mt: 1, width: '100%' }}
                >
                  Create account
                </PrimaryButton>
              </Box>
            </CardContent>
          </Card>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
            Already have an account?{' '}
            <Box
              component={RouterLink}
              to="/login"
              sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}
            >
              Log in
            </Box>
          </Typography>
        </Box>
      </PageContainer>
    </AppShell>
  );
}
