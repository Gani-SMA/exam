import express from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  logout, 
  refreshToken, 
  forgotPassword, 
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
  getProfile,
  updateProfile
} from '@/controllers/authController';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validation';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists().withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail(),
];

const resetPasswordValidation = [
  body('token').exists().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const changePasswordValidation = [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', authenticate, logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', authenticate, resendVerification);
router.post('/change-password', authenticate, changePasswordValidation, validate, changePassword);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;