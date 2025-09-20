import express from 'express';
import { User } from '../models/User';
import { ExamSession } from '../models/ExamSession';
import { Battle } from '../models/Battle';
import { AppError, catchAsync } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validatePagination, validateObjectId } from '../middleware/validation';

const router = express.Router();

const getUserProfile = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  
  const user = await User.findById(userId)
    .populate('gamification.achievements', 'name description icon color')
    .select('-password -emailVerificationToken -passwordResetToken');

  if (!user) {
    return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
  }

  if (!user.settings.privacy.shareProgress && !req.user?._id.equals(userId) && req.user?.role !== 'admin') {
    return next(new AppError('User profile is private', 403, 'PROFILE_PRIVATE'));
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
});

const getUserStats = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  
  if (!req.user?._id.equals(userId) && req.user?.role !== 'admin') {
    return next(new AppError('Access denied', 403, 'ACCESS_DENIED'));
  }

  const [examStats, battleStats, recentActivity] = await Promise.all([
    ExamSession.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          averageScore: { $avg: '$score.percentage' },
          totalTime: { $sum: '$actualDuration' },
          bestScore: { $max: '$score.percentage' }
        }
      }
    ]),
    Battle.aggregate([
      { $match: { 'participants.userId': userId } },
      { $unwind: '$participants' },
      { $match: { 'participants.userId': userId } },
      {
        $group: {
          _id: null,
          totalBattles: { $sum: 1 },
          wins: { $sum: { $cond: [{ $eq: ['$participants.rank', 1] }, 1, 0] } },
          averageRank: { $avg: '$participants.rank' }
        }
      }
    ]),
    ExamSession.find({ userId })
      .populate('examId', 'title type')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('examId score status createdAt')
  ]);

  const stats = {
    exams: examStats[0] || { totalSessions: 0, completedSessions: 0, averageScore: 0, totalTime: 0, bestScore: 0 },
    battles: battleStats[0] || { totalBattles: 0, wins: 0, averageRank: 0 },
    recentActivity
  };

  res.status(200).json({
    success: true,
    data: { stats }
  });
});

const searchUsers = catchAsync(async (req, res, next) => {
  const { q, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  if (!q || (q as string).length < 2) {
    return next(new AppError('Search query must be at least 2 characters', 400, 'INVALID_QUERY'));
  }

  const users = await User.find({
    $and: [
      {
        $or: [
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ]
      },
      { 'settings.privacy.allowFriendRequests': true }
    ]
  })
  .select('firstName lastName avatar gamification.level')
  .skip(skip)
  .limit(parseInt(limit as string));

  res.status(200).json({
    success: true,
    data: { users }
  });
});

router.get('/search', authenticate, searchUsers);
router.get('/:userId', validateObjectId('userId'), getUserProfile);
router.get('/:userId/stats', authenticate, validateObjectId('userId'), getUserStats);

export default router;