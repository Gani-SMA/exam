import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

import { useLoginMutation } from '../../store/api/authApi';
import { loginSuccess } from '../../store/slices/authSlice';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

type FormData = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const result = await login(data).unwrap();
      dispatch(loginSuccess(result.data));
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Login failed';
      toast.error(errorMessage);
    }
  };

  const handleGoogleLogin = () => {
    // Implement Google OAuth login
    toast('Google login coming soon!', { icon: 'ℹ️' });
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
          Welcome Back
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sign in to continue your exam preparation journey
        </Typography>
      </Box>

      {/* Login Form */}
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
              sx={{ mb: 2 }}
              autoComplete="email"
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              error={!!errors.password}
              helperText={errors.password?.message}
              sx={{ mb: 3 }}
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
            mb: 2,
            background: 'linear-gradient(45deg, #1976d2, #dc004e)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0, #9a0036)',
            },
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Link
            component={RouterLink}
            to="/forgot-password"
            variant="body2"
            underline="hover"
          >
            Forgot your password?
          </Link>
        </Box>
      </Box>

      {/* Divider */}
      <Divider sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* Social Login */}
      <Button
        fullWidth
        variant="outlined"
        size="large"
        startIcon={<GoogleIcon />}
        onClick={handleGoogleLogin}
        sx={{
          py: 1.5,
          mb: 3,
          borderColor: 'divider',
          color: 'text.primary',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        Continue with Google
      </Button>

      {/* Sign Up Link */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
          <Link
            component={RouterLink}
            to="/register"
            variant="body2"
            sx={{ fontWeight: 600 }}
          >
            Sign up here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginPage;