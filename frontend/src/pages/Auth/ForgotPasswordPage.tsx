import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link as RouterLink } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useForgotPasswordMutation } from '../../store/api/authApi';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
});

type FormData = {
  email: string;
};

const ForgotPasswordPage: React.FC = () => {
  const [forgotPassword, { isLoading, isSuccess }] = useForgotPasswordMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await forgotPassword(data).unwrap();
      toast.success('Password reset email sent!');
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Failed to send reset email';
      toast.error(errorMessage);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #1976d2, #dc004e)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Forgot Password?
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your email address and we'll send you a link to reset your password
        </Typography>
      </Box>

      {isSuccess ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            We've sent a password reset link to your email address. Please check your inbox
            and follow the instructions to reset your password.
          </Typography>
        </Alert>
      ) : (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 3 }}>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Email Address"
                type="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 3 }}
                autoComplete="email"
                autoFocus
              />
            )}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{
              py: 1.5,
              mb: 3,
              background: 'linear-gradient(45deg, #1976d2, #dc004e)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0, #9a0036)',
              },
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
          </Button>
        </Box>
      )}

      {/* Back to Login */}
      <Box sx={{ textAlign: 'center' }}>
        <Link
          component={RouterLink}
          to="/login"
          variant="body2"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            fontWeight: 600,
          }}
        >
          <ArrowBack fontSize="small" />
          Back to Sign In
        </Link>
      </Box>
    </Box>
  );
};

export default ForgotPasswordPage;