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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

import { useRegisterMutation } from '../../store/api/authApi';
import { loginSuccess } from '../../store/slices/authSlice';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  role: yup.string().required('Please select your role'),
});

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [register, { isLoading }] = useRegisterMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      const result = await register(registerData).unwrap();
      dispatch(loginSuccess(result.data));
      toast.success('Registration successful! Welcome aboard!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const errorMessage = (error as { data?: { message?: string } })?.data?.message || 'Registration failed';
      toast.error(errorMessage);
    }
  };

  const handleGoogleSignup = () => {
    // Implement Google OAuth signup
    toast('Google signup coming soon!', { icon: 'ℹ️' });
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
          Create Account
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Join thousands of students preparing for success
        </Typography>
      </Box>

      {/* Registration Form */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="First Name"
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                autoComplete="given-name"
              />
            )}
          />

          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Last Name"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                autoComplete="family-name"
              />
            )}
          />
        </Box>

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
          name="role"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.role}>
              <InputLabel>I am a</InputLabel>
              <Select {...field} label="I am a">
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="educator">Educator</MenuItem>
              </Select>
              {errors.role && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                  {errors.role.message}
                </Typography>
              )}
            </FormControl>
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
              sx={{ mb: 2 }}
              autoComplete="new-password"
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

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              sx={{ mb: 3 }}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
          {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
        </Button>
      </Box>

      {/* Divider */}
      <Divider sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
      </Divider>

      {/* Social Signup */}
      <Button
        fullWidth
        variant="outlined"
        size="large"
        startIcon={<GoogleIcon />}
        onClick={handleGoogleSignup}
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

      {/* Sign In Link */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Already have an account?{' '}
          <Link
            component={RouterLink}
            to="/login"
            variant="body2"
            sx={{ fontWeight: 600 }}
          >
            Sign in here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;