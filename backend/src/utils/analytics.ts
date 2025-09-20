import { User } from '../models/User';
import { Exam } from '../models/Exam';
import { ExamSession } from '../models/ExamSession';
import { Question } from '../models/Question';
import { Battle } from '../models/Battle';
import { cacheService } from '../config/redis';
import { logger } from './logger';

export interface AnalyticsData {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    retentionRate: number;
  };
  exams: {
    total: number;
    completed: number;
    averageScore: number;
    popularTypes: { type: string; count: number }[];
  };
  questions: {
    total: number;
    byDifficulty: { difficulty: string; count: number }[];
    bySubject: { subject: string; count: number }[];
    averageAccuracy: number;
  };
  battles: {
    total: number;
    active: number;
    averageParticipants: number;
    popularModes: { mode: string; count: number }[];
  };
  engagement: {
    dailyActiveUsers: number;
    averageSessionTime: number;
    questionsPerDay: number;
    battlesPerDay: number;
  };
}

export const generateAnalytics = async (timeframe: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<AnalyticsData> => {
  const cacheKey = `analytics:${timeframe}`;
  const cached = await cacheService.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const timeFilter = getTimeFilter(timeframe);
  
  try {
    const [
      userStats,
      examStats,
      questionStats,
      battleStats,
      engagementStats
    ] = await Promise.all([
      getUserAnalytics(timeFilter),
      getExamAnalytics(timeFilter),
      getQuestionAnalytics(),
      getBattleAnalytics(timeFilter),
      getEngagementAnalytics(timeFilter)
    ]);

    const analytics: AnalyticsData = {
      users: userStats,
      exams: examStats,
      questions: questionStats,
      battles: battleStats,
      engagement: engagementStats
    };

    // Cache for appropriate time based on timeframe
    const cacheTime = timeframe === 'day' ? 300 : timeframe === 'week' ? 1800 : 3600; // 5min, 30min, 1hour
    await cacheService.set(cacheKey, JSON.stringify(analytics), cacheTime);

    return analytics;
  } catch (error) {
    logger.error('Analytics generation failed', { error, timeframe });
    throw error;
  }
};

const getUserAnalytics = async (timeFilter: Date) => {
  const [totalUsers, activeUsers, newUsers, retentionData] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastActivity: { $gte: timeFilter } }),
    User.countDocuments({ createdAt: { $gte: timeFilter } }),
    calculateRetentionRate(timeFilter)
  ]);

  return {
    total: totalUsers,
    active: activeUsers,
    newThisMonth: newUsers,
    retentionRate: retentionData
  };
};

const getExamAnalytics = async (timeFilter: Date) => {
  const [
    totalExams,
    completedSessions,
    averageScoreData,
    popularTypes
  ] = await Promise.all([
    Exam.countDocuments({ isActive: true }),
    ExamSession.countDocuments({ 
      status: 'completed',
      createdAt: { $gte: timeFilter }
    }),
    ExamSession.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: timeFilter }
        }
      },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$score.percentage' }
        }
      }
    ]),
    Exam.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);

  return {
    total: totalExams,
    completed: completedSessions,
    averageScore: averageScoreData[0]?.averageScore || 0,
    popularTypes: popularTypes.map(item => ({ type: item._id, count: item.count }))
  };
};

const getQuestionAnalytics = async () => {
  const [
    totalQuestions,
    difficultyDistribution,
    subjectDistribution,
    accuracyData
  ] = await Promise.all([
    Question.countDocuments({ isActive: true, reviewStatus: 'approved' }),
    Question.aggregate([
      { $match: { isActive: true, reviewStatus: 'approved' } },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]),
    Question.aggregate([
      { $match: { isActive: true, reviewStatus: 'approved' } },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    Question.aggregate([
      { 
        $match: { 
          isActive: true, 
          reviewStatus: 'approved',
          'statistics.timesAnswered': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          averageAccuracy: {
            $avg: {
              $multiply: [
                { $divide: ['$statistics.correctAnswers', '$statistics.timesAnswered'] },
                100
              ]
            }
          }
        }
      }
    ])
  ]);

  return {
    total: totalQuestions,
    byDifficulty: difficultyDistribution.map(item => ({ difficulty: item._id, count: item.count })),
    bySubject: subjectDistribution.map(item => ({ subject: item._id, count: item.count })),
    averageAccuracy: accuracyData[0]?.averageAccuracy || 0
  };
};

const getBattleAnalytics = async (timeFilter: Date) => {
  const [
    totalBattles,
    activeBattles,
    participantData,
    popularModes
  ] = await Promise.all([
    Battle.countDocuments({ createdAt: { $gte: timeFilter } }),
    Battle.countDocuments({ status: 'active' }),
    Battle.aggregate([
      { $match: { createdAt: { $gte: timeFilter } } },
      {
        $group: {
          _id: null,
          averageParticipants: { $avg: { $size: '$participants' } }
        }
      }
    ]),
    Battle.aggregate([
      { $match: { createdAt: { $gte: timeFilter } } },
      {
        $group: {
          _id: '$mode',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ])
  ]);

  return {
    total: totalBattles,
    active: activeBattles,
    averageParticipants: participantData[0]?.averageParticipants || 0,
    popularModes: popularModes.map(item => ({ mode: item._id, count: item.count }))
  };
};

const getEngagementAnalytics = async (timeFilter: Date) => {
  const [
    dailyActiveUsers,
    sessionTimeData,
    questionsPerDay,
    battlesPerDay
  ] = await Promise.all([
    User.countDocuments({ 
      lastActivity: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }),
    ExamSession.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: timeFilter }
        }
      },
      {
        $group: {
          _id: null,
          averageTime: { $avg: '$actualDuration' }
        }
      }
    ]),
    ExamSession.aggregate([
      { $match: { createdAt: { $gte: timeFilter } } },
      { $unwind: '$answers' },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          averagePerDay: { $avg: '$count' }
        }
      }
    ]),
    Battle.aggregate([
      { $match: { createdAt: { $gte: timeFilter } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          averagePerDay: { $avg: '$count' }
        }
      }
    ])
  ]);

  return {
    dailyActiveUsers,
    averageSessionTime: sessionTimeData[0]?.averageTime || 0,
    questionsPerDay: questionsPerDay[0]?.averagePerDay || 0,
    battlesPerDay: battlesPerDay[0]?.averagePerDay || 0
  };
};

const calculateRetentionRate = async (timeFilter: Date): Promise<number> => {
  const usersFromPeriod = await User.find({
    createdAt: { $gte: timeFilter }
  }).select('_id createdAt');

  if (usersFromPeriod.length === 0) return 0;

  const retainedUsers = await User.countDocuments({
    _id: { $in: usersFromPeriod.map(u => u._id) },
    lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  });

  return (retainedUsers / usersFromPeriod.length) * 100;
};

const getTimeFilter = (timeframe: string): Date => {
  const now = new Date();
  
  switch (timeframe) {
    case 'day':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
};

export const trackUserActivity = async (userId: string, activity: string, metadata?: any): Promise<void> => {
  try {
    // Update user's last activity
    await User.findByIdAndUpdate(userId, { lastActivity: new Date() });
    
    // Log activity for analytics
    logger.info('User activity tracked', {
      userId,
      activity,
      metadata,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to track user activity', { userId, activity, error });
  }
};

export const generateUserReport = async (userId: string, timeframe: 'week' | 'month' | 'year' = 'month') => {
  const timeFilter = getTimeFilter(timeframe);
  
  const [examPerformance, battlePerformance, streakData, achievements] = await Promise.all([
    ExamSession.aggregate([
      { $match: { userId: userId, createdAt: { $gte: timeFilter } } },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          averageScore: { $avg: '$score.percentage' },
          totalTime: { $sum: '$actualDuration' },
          bestScore: { $max: '$score.percentage' }
        }
      }
    ]),
    Battle.aggregate([
      { $match: { 'participants.userId': userId, createdAt: { $gte: timeFilter } } },
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
    User.findById(userId).select('gamification.streak'),
    User.findById(userId).populate('gamification.achievements', 'name earnedAt')
  ]);

  return {
    timeframe,
    examPerformance: examPerformance[0] || { totalExams: 0, averageScore: 0, totalTime: 0, bestScore: 0 },
    battlePerformance: battlePerformance[0] || { totalBattles: 0, wins: 0, averageRank: 0 },
    streakData: streakData?.gamification.streak || { current: 0, longest: 0 },
    recentAchievements: achievements?.gamification.achievements.slice(-5) || [],
    generatedAt: new Date()
  };
};