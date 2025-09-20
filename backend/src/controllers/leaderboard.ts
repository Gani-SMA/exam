import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { ExamSession } from '../models/ExamSession';
import { Battle } from '../models/Battle';
import { AppError, catchAsync } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { cacheService } from '../config/redis';

export const getGlobalLeaderboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  
  const { timeframe = 'all', examType, subject } = req.query;

  // Check cache first
  const cacheKey = `leaderboard:global:${timeframe}:${examType || 'all'}:${subject || 'all'}:${page}:${limit}`;
  const cachedResult = await cacheService.get(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json({
      success: true,
      data: JSON.parse(cachedResult),
      cached: true
    });
  }

  // Build aggregation pipeline
  const pipeline: any[] = [
    {
      $match: {
        'settings.privacy.showInLeaderboard': true,
        'gamification.totalXP': { $gt: 0 }
      }
    }
  ];

  // Add time-based filtering if needed
  if (timeframe !== 'all') {
    const timeFilter = getTimeFilter(timeframe);
    if (timeFilter) {
      pipeline.push({
        $match: {
          'gamification.streak.lastActivity': { $gte: timeFilter }
        }
      });
    }
  }

  // Add exam type filtering
  if (examType) {
    pipeline.push({
      $match: {
        'examPreferences.preferredExamTypes': examType
      }
    });
  }

  pipeline.push(
    {
      $addFields: {
        totalScore: '$statistics.averageScore',
        rank: { $rank: {} }
      }
    },
    {
      $sort: {
        'gamification.totalXP': -1,
        'statistics.averageScore': -1,
        'gamification.level': -1
      }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        avatar: 1,
        'gamification.level': 1,
        'gamification.totalXP': 1,
        'gamification.streak.current': 1,
        'gamification.streak.longest': 1,
        'statistics.averageScore': 1,
        'statistics.totalExamsTaken': 1,
        'statistics.totalQuestionsAnswered': 1,
        createdAt: 1
      }
    }
  );

  const [leaderboard, totalCount] = await Promise.all([
    User.aggregate(pipeline),
    User.countDocuments({
      'settings.privacy.showInLeaderboard': true,
      'gamification.totalXP': { $gt: 0 }
    })
  ]);

  // Add rank to each user
  const rankedLeaderboard = leaderboard.map((user, index) => ({
    ...user,
    rank: skip + index + 1,
    fullName: `${user.firstName} ${user.lastName}`
  }));

  const result = {
    leaderboard: rankedLeaderboard,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    },
    metadata: {
      timeframe,
      examType: examType || 'all',
      subject: subject || 'all',
      generatedAt: new Date()
    }
  };

  // Cache for 5 minutes
  await cacheService.set(cacheKey, JSON.stringify(result), 300);

  res.status(200).json({
    success: true,
    data: result
  });
});

export const getSubjectLeaderboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { subject } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  
  const { timeframe = 'all' } = req.query;

  const cacheKey = `leaderboard:subject:${subject}:${timeframe}:${page}:${limit}`;
  const cachedResult = await cacheService.get(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json({
      success: true,
      data: JSON.parse(cachedResult),
      cached: true
    });
  }

  // Get users with performance in the specific subject
  const pipeline: any[] = [
    {
      $match: {
        'settings.privacy.showInLeaderboard': true,
        'statistics.subjectWiseStats.subject': subject
      }
    },
    {
      $addFields: {
        subjectStats: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$statistics.subjectWiseStats',
                cond: { $eq: ['$$this.subject', subject] }
              }
            },
            0
          ]
        }
      }
    },
    {
      $match: {
        'subjectStats.questionsAnswered': { $gt: 0 }
      }
    },
    {
      $addFields: {
        subjectAccuracy: {
          $multiply: [
            { $divide: ['$subjectStats.correctAnswers', '$subjectStats.questionsAnswered'] },
            100
          ]
        }
      }
    },
    {
      $sort: {
        subjectAccuracy: -1,
        'subjectStats.questionsAnswered': -1,
        'gamification.totalXP': -1
      }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        firstName: 1,
        lastName: 1,
        avatar: 1,
        'gamification.level': 1,
        'gamification.totalXP': 1,
        subjectStats: 1,
        subjectAccuracy: 1
      }
    }
  ];

  const [leaderboard, totalCount] = await Promise.all([
    User.aggregate(pipeline),
    User.countDocuments({
      'settings.privacy.showInLeaderboard': true,
      'statistics.subjectWiseStats.subject': subject,
      'statistics.subjectWiseStats.questionsAnswered': { $gt: 0 }
    })
  ]);

  const rankedLeaderboard = leaderboard.map((user, index) => ({
    ...user,
    rank: skip + index + 1,
    fullName: `${user.firstName} ${user.lastName}`,
    accuracy: Math.round(user.subjectAccuracy || 0)
  }));

  const result = {
    leaderboard: rankedLeaderboard,
    subject,
    pagination: {
      page,
      limit,
      total: totalCount,
      pages: Math.ceil(totalCount / limit)
    },
    metadata: {
      timeframe,
      generatedAt: new Date()
    }
  };

  await cacheService.set(cacheKey, JSON.stringify(result), 300);

  res.status(200).json({
    success: true,
    data: result
  });
});

export const getBattleLeaderboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  
  const { timeframe = 'all', battleType } = req.query;

  const cacheKey = `leaderboard:battle:${timeframe}:${battleType || 'all'}:${page}:${limit}`;
  const cachedResult = await cacheService.get(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json({
      success: true,
      data: JSON.parse(cachedResult),
      cached: true
    });
  }

  // Build battle filter
  const battleFilter: any = { status: 'completed' };
  
  if (battleType) {
    battleFilter.type = battleType;
  }

  if (timeframe !== 'all') {
    const timeFilter = getTimeFilter(timeframe);
    if (timeFilter) {
      battleFilter.createdAt = { $gte: timeFilter };
    }
  }

  // Aggregate battle performance
  const pipeline: any[] = [
    {
      $match: battleFilter
    },
    {
      $unwind: '$participants'
    },
    {
      $group: {
        _id: '$participants.userId',
        totalBattles: { $sum: 1 },
        totalWins: {
          $sum: {
            $cond: [{ $eq: ['$participants.rank', 1] }, 1, 0]
          }
        },
        totalScore: { $sum: '$participants.score' },
        averageScore: { $avg: '$participants.score' },
        averageRank: { $avg: '$participants.rank' },
        bestRank: { $min: '$participants.rank' }
      }
    },
    {
      $addFields: {
        winRate: {
          $multiply: [
            { $divide: ['$totalWins', '$totalBattles'] },
            100
          ]
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $match: {
        'user.settings.privacy.showInLeaderboard': true
      }
    },
    {
      $sort: {
        winRate: -1,
        totalWins: -1,
        averageScore: -1
      }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        'user.firstName': 1,
        'user.lastName': 1,
        'user.avatar': 1,
        'user.gamification.level': 1,
        totalBattles: 1,
        totalWins: 1,
        winRate: 1,
        averageScore: 1,
        averageRank: 1,
        bestRank: 1
      }
    }
  ];

  const leaderboard = await Battle.aggregate(pipeline);

  const rankedLeaderboard = leaderboard.map((entry, index) => ({
    rank: skip + index + 1,
    userId: entry._id,
    firstName: entry.user.firstName,
    lastName: entry.user.lastName,
    fullName: `${entry.user.firstName} ${entry.user.lastName}`,
    avatar: entry.user.avatar,
    level: entry.user.gamification.level,
    totalBattles: entry.totalBattles,
    totalWins: entry.totalWins,
    winRate: Math.round(entry.winRate || 0),
    averageScore: Math.round(entry.averageScore || 0),
    averageRank: Math.round(entry.averageRank || 0),
    bestRank: entry.bestRank
  }));

  const result = {
    leaderboard: rankedLeaderboard,
    pagination: {
      page,
      limit,
      total: rankedLeaderboard.length,
      pages: Math.ceil(rankedLeaderboard.length / limit)
    },
    metadata: {
      timeframe,
      battleType: battleType || 'all',
      generatedAt: new Date()
    }
  };

  await cacheService.set(cacheKey, JSON.stringify(result), 300);

  res.status(200).json({
    success: true,
    data: result
  });
});

export const getUserRank = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!._id;
  const { type = 'global', subject, examType } = req.query;

  let rank = 0;
  let totalUsers = 0;
  let userStats = {};

  if (type === 'global') {
    // Global ranking based on total XP
    const betterUsers = await User.countDocuments({
      'settings.privacy.showInLeaderboard': true,
      'gamification.totalXP': { $gt: req.user!.gamification.totalXP }
    });
    
    rank = betterUsers + 1;
    totalUsers = await User.countDocuments({
      'settings.privacy.showInLeaderboard': true,
      'gamification.totalXP': { $gt: 0 }
    });

    userStats = {
      totalXP: req.user!.gamification.totalXP,
      level: req.user!.gamification.level,
      averageScore: req.user!.statistics.averageScore,
      totalExams: req.user!.statistics.totalExamsTaken
    };

  } else if (type === 'subject' && subject) {
    // Subject-specific ranking
    const userSubjectStats = req.user!.statistics.subjectWiseStats.find(
      s => s.subject === subject
    );

    if (userSubjectStats) {
      const userAccuracy = (userSubjectStats.correctAnswers / userSubjectStats.questionsAnswered) * 100;
      
      const betterUsers = await User.countDocuments({
        'settings.privacy.showInLeaderboard': true,
        'statistics.subjectWiseStats': {
          $elemMatch: {
            subject: subject,
            $expr: {
              $gt: [
                { $multiply: [{ $divide: ['$correctAnswers', '$questionsAnswered'] }, 100] },
                userAccuracy
              ]
            }
          }
        }
      });

      rank = betterUsers + 1;
      totalUsers = await User.countDocuments({
        'settings.privacy.showInLeaderboard': true,
        'statistics.subjectWiseStats.subject': subject,
        'statistics.subjectWiseStats.questionsAnswered': { $gt: 0 }
      });

      userStats = {
        accuracy: Math.round(userAccuracy),
        questionsAnswered: userSubjectStats.questionsAnswered,
        correctAnswers: userSubjectStats.correctAnswers,
        averageTime: userSubjectStats.averageTime
      };
    }

  } else if (type === 'battle') {
    // Battle ranking based on win rate
    const userBattleStats = await Battle.aggregate([
      {
        $match: {
          status: 'completed',
          'participants.userId': userId
        }
      },
      {
        $unwind: '$participants'
      },
      {
        $match: {
          'participants.userId': userId
        }
      },
      {
        $group: {
          _id: null,
          totalBattles: { $sum: 1 },
          totalWins: {
            $sum: {
              $cond: [{ $eq: ['$participants.rank', 1] }, 1, 0]
            }
          },
          averageScore: { $avg: '$participants.score' }
        }
      }
    ]);

    if (userBattleStats.length > 0) {
      const stats = userBattleStats[0];
      const userWinRate = (stats.totalWins / stats.totalBattles) * 100;

      // Count users with better win rates
      const betterUsers = await Battle.aggregate([
        {
          $match: { status: 'completed' }
        },
        {
          $unwind: '$participants'
        },
        {
          $group: {
            _id: '$participants.userId',
            totalBattles: { $sum: 1 },
            totalWins: {
              $sum: {
                $cond: [{ $eq: ['$participants.rank', 1] }, 1, 0]
              }
            }
          }
        },
        {
          $addFields: {
            winRate: {
              $multiply: [
                { $divide: ['$totalWins', '$totalBattles'] },
                100
              ]
            }
          }
        },
        {
          $match: {
            winRate: { $gt: userWinRate }
          }
        },
        {
          $count: 'count'
        }
      ]);

      rank = (betterUsers[0]?.count || 0) + 1;
      
      userStats = {
        totalBattles: stats.totalBattles,
        totalWins: stats.totalWins,
        winRate: Math.round(userWinRate),
        averageScore: Math.round(stats.averageScore)
      };
    }
  }

  const percentile = totalUsers > 0 ? Math.round(((totalUsers - rank + 1) / totalUsers) * 100) : 0;

  res.status(200).json({
    success: true,
    data: {
      rank,
      totalUsers,
      percentile,
      type,
      subject: subject || null,
      examType: examType || null,
      userStats,
      generatedAt: new Date()
    }
  });
});

export const getLeaderboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const cacheKey = 'leaderboard:stats:overview';
  const cachedResult = await cacheService.get(cacheKey);
  
  if (cachedResult) {
    return res.status(200).json({
      success: true,
      data: JSON.parse(cachedResult),
      cached: true
    });
  }

  const [
    totalUsers,
    activeUsers,
    topPerformers,
    battleStats,
    subjectStats
  ] = await Promise.all([
    User.countDocuments({ 'settings.privacy.showInLeaderboard': true }),
    User.countDocuments({
      'settings.privacy.showInLeaderboard': true,
      lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    User.find({
      'settings.privacy.showInLeaderboard': true,
      'gamification.totalXP': { $gt: 0 }
    })
    .sort({ 'gamification.totalXP': -1 })
    .limit(10)
    .select('firstName lastName avatar gamification.level gamification.totalXP statistics.averageScore'),
    
    Battle.aggregate([
      {
        $match: { status: 'completed' }
      },
      {
        $group: {
          _id: null,
          totalBattles: { $sum: 1 },
          totalParticipants: { $sum: { $size: '$participants' } },
          averageParticipants: { $avg: { $size: '$participants' } }
        }
      }
    ]),
    
    User.aggregate([
      {
        $unwind: '$statistics.subjectWiseStats'
      },
      {
        $group: {
          _id: '$statistics.subjectWiseStats.subject',
          totalQuestions: { $sum: '$statistics.subjectWiseStats.questionsAnswered' },
          totalCorrect: { $sum: '$statistics.subjectWiseStats.correctAnswers' },
          userCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          accuracy: {
            $multiply: [
              { $divide: ['$totalCorrect', '$totalQuestions'] },
              100
            ]
          }
        }
      },
      {
        $sort: { userCount: -1 }
      },
      {
        $limit: 10
      }
    ])
  ]);

  const stats = {
    overview: {
      totalUsers,
      activeUsers,
      participationRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    },
    topPerformers: topPerformers.map((user, index) => ({
      rank: index + 1,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      avatar: user.avatar,
      level: user.gamification.level,
      totalXP: user.gamification.totalXP,
      averageScore: user.statistics.averageScore
    })),
    battleStats: battleStats[0] || {
      totalBattles: 0,
      totalParticipants: 0,
      averageParticipants: 0
    },
    popularSubjects: subjectStats.map(subject => ({
      name: subject._id,
      userCount: subject.userCount,
      totalQuestions: subject.totalQuestions,
      accuracy: Math.round(subject.accuracy || 0)
    })),
    generatedAt: new Date()
  };

  // Cache for 10 minutes
  await cacheService.set(cacheKey, JSON.stringify(stats), 600);

  res.status(200).json({
    success: true,
    data: stats
  });
});

// Helper function to get time filter based on timeframe
function getTimeFilter(timeframe: string): Date | null {
  const now = new Date();
  
  switch (timeframe) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'year':
      return new Date(now.getFullYear(), 0, 1);
    default:
      return null;
  }
}