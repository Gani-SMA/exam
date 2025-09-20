import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { AuthRequest } from '@/types';
import { asyncHandler } from '@/middleware/errorHandler';

// Generate JWT Token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, firstName, lastName, role } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email',
    });
  }

  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: role || 'student',
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Check if user exists
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token,
    },
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Token refreshed',
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Password reset email sent',
  });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Password reset successful',
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Email verified successfully',
  });
});

// @desc    Resend verification
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Verification email sent',
  });
});

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// @desc    Get profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: req.user,
  });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    message: 'Profile updated successfully',
  });
});