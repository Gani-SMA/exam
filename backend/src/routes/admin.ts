import express from 'express';
import { User } from '../models/User';
import { Exam } from '../models/Exam';
import { Question } from '../models/Question';
import { ExamSession } from '../models/ExamSession';
import { Battle } from '../models/Battle';
import { AppError, catchAsync } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';

const router = express.Router();

const getDashboardStats = catchAsync(async (req, res, next) => {
  const [
    userStats,
    examStats,
    questionStats,
    sessionStats,
    battleStats,
    recentActivity
  ] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $gte: ['$lastActivity', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }, 1, 0] } },
          verified: { $sum: { $cond: ['$isEmailVerified', 1, 0] } }
        }
      }
    ]),
    Exam.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          byType: { $push: '$type' }
        }
      }
    ]),
    Question.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$reviewStatus', 'approved'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$reviewStatus', 'pending'] }, 1, 0] } }
        }
      }
    ]),
    ExamSession.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          averageScore: { $avg: '$score.percentage' }
        }
      }
    ]),
    Battle.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]),
    ExamSession.find()
      .populate('userId', 'firstName lastName')
      .populate('examId', 'title type')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('userId examId score status createdAt')
  ]);

  const stats = {
    users: userStats[0] || { total: 0, active: 0, verified: 0 },
    exams: examStats[0] || { total: 0, active: 0, byType: [] },
    questions: questionStats[0] || { total: 0, approved: 0, pending: 0 },
    sessions: sessionStats[0] || { total: 0, completed: 0, averageScore: 0 },
    battles: battleStats[0] || { total: 0, active: 0, completed: 0 },
    recentActivity
  };

  res.status(200).json({
    success: true,
    data: { stats }
  });
});

const getUsers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const { role, status, search } = req.query;

  const filter: any = {};
  if (role) filter.role = role;
  if (status === 'active') filter.lastActivity = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
  if (status === 'verified') filter.isEmailVerified = true;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  });
});

const updateUserRole = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!['student', 'instructor', 'admin'].includes(role)) {
    return next(new AppError('Invalid role', 400, 'INVALID_ROLE'));
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true }
  ).select('-password');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    data: { user }
  });
});

const getSystemHealth = catchAsync(async (req, res, next) => {
  const health = {
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected',
    redis: 'connected'
  };

  res.status(200).json({
    success: true,
    data: { health }
  });
});

router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', validatePagination, getUsers);
router.put('/users/:userId/role', updateUserRole);
router.get('/health', getSystemHealth);

export default router;