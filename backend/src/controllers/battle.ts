import { Request, Response, NextFunction } from 'express';
import { Battle } from '../models/Battle';
import { Question } from '../models/Question';
import { User } from '../models/User';
import { AppError, catchAsync } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { socketUtils } from '../config/socket';
import { validationResult } from 'express-validator';

export const getBattles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const { status, type, mode, subject, difficulty } = req.query;

  const filter: any = {};
  
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (mode) filter.mode = mode;
  if (subject) filter.subject = subject;
  if (difficulty) filter.difficulty = difficulty;

  // Show public battles or user's battles
  if (req.user) {
    filter.$or = [
      { isPublic: true },
      { createdBy: req.user._id },
      { 'participants.userId': req.user._id }
    ];
  } else {
    filter.isPublic = true;
  }

  const battles = await Battle.find(filter)
    .populate('createdBy', 'firstName lastName avatar')
    .populate('participants.userId', 'firstName lastName avatar gamification.level')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Battle.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      battles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  });
});

export const getBattle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const battle = await Battle.findById(req.params.id)
    .populate('createdBy', 'firstName lastName avatar')
    .populate('participants.userId', 'firstName lastName avatar gamification.level')
    .populate('questions', 'type subject topic difficulty points estimatedTime');

  if (!battle) {
    return next(new AppError('Battle not found', 404, 'BATTLE_NOT_FOUND'));
  }

  // Check access permissions
  if (!battle.isPublic && req.user && 
      !battle.createdBy.equals(req.user._id) && 
      !battle.participants.some(p => p.userId.equals(req.user._id))) {
    return next(new AppError('Access denied to this battle', 403, 'BATTLE_ACCESS_DENIED'));
  }

  res.status(200).json({
    success: true,
    data: { battle }
  });
});

export const createBattle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array()));
  }

  const {
    title,
    description,
    type,
    mode,
    questionCount,
    timeLimit,
    subject,
    topics,
    difficulty,
    maxParticipants,
    settings,
    isPublic = true,
    password
  } = req.body;

  // Find questions based on criteria
  const questionFilter: any = {
    isActive: true,
    reviewStatus: 'approved',
    subject
  };

  if (topics && topics.length > 0) {
    questionFilter.topic = { $in: topics };
  }

  if (difficulty !== 'mixed') {
    questionFilter.difficulty = difficulty;
  }

  const availableQuestions = await Question.find(questionFilter).limit(questionCount * 2);

  if (availableQuestions.length < questionCount) {
    return next(new AppError(`Not enough questions available. Found ${availableQuestions.length}, need ${questionCount}`, 400, 'INSUFFICIENT_QUESTIONS'));
  }

  // Randomly select questions
  const selectedQuestions = shuffleArray(availableQuestions).slice(0, questionCount);

  const battle = await Battle.create({
    title,
    description,
    type,
    mode,
    questionCount,
    timeLimit,
    subject,
    topics: topics || [],
    difficulty,
    maxParticipants,
    questions: selectedQuestions.map(q => q._id),
    settings: {
      allowSpectators: true,
      showLeaderboard: true,
      allowChat: true,
      powerUpsEnabled: false,
      negativeMarking: false,
      shuffleQuestions: true,
      instantFeedback: true,
      showCorrectAnswers: true,
      ...settings
    },
    participants: [{
      userId: req.user!._id,
      username: `${req.user!.firstName} ${req.user!.lastName}`,
      avatar: req.user!.avatar,
      joinedAt: new Date(),
      isReady: false,
      score: 0,
      answers: [],
      performance: {
        correctAnswers: 0,
        incorrectAnswers: 0,
        averageTime: 0,
        streak: 0,
        maxStreak: 0
      }
    }],
    analytics: {
      totalParticipants: 1,
      averageScore: 0,
      averageCompletionTime: 0,
      questionStats: [],
      engagementMetrics: {
        chatMessages: 0,
        powerUpsUsed: 0,
        spectatorCount: 0
      }
    },
    createdBy: req.user!._id,
    isPublic,
    password: password ? await hashPassword(password) : undefined
  });

  await battle.populate([
    { path: 'createdBy', select: 'firstName lastName avatar' },
    { path: 'questions', select: 'type subject topic difficulty points' }
  ]);

  logger.info('Battle created successfully', {
    battleId: battle._id,
    title: battle.title,
    type: battle.type,
    createdBy: req.user!._id
  });

  // Emit to real-time system
  const io = req.app.get('io');
  if (io) {
    socketUtils.broadcast(io, 'battle-created', {
      battle: {
        _id: battle._id,
        title: battle.title,
        type: battle.type,
        mode: battle.mode,
        subject: battle.subject,
        difficulty: battle.difficulty,
        maxParticipants: battle.maxParticipants,
        currentParticipants: battle.participants.length,
        createdBy: battle.createdBy
      }
    });
  }

  res.status(201).json({
    success: true,
    message: 'Battle created successfully',
    data: { battle }
  });
});

export const joinBattle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { battleId } = req.params;
  const { password } = req.body;
  const userId = req.user!._id;

  const battle = await Battle.findById(battleId);

  if (!battle) {
    return next(new AppError('Battle not found', 404, 'BATTLE_NOT_FOUND'));
  }

  if (battle.status !== 'waiting') {
    return next(new AppError('Battle is not accepting new participants', 400, 'BATTLE_NOT_JOINABLE'));
  }

  if (battle.participants.length >= battle.maxParticipants) {
    return next(new AppError('Battle is full', 400, 'BATTLE_FULL'));
  }

  // Check if user is already a participant
  const existingParticipant = battle.participants.find(p => p.userId.equals(userId));
  if (existingParticipant) {
    return res.status(200).json({
      success: true,
      message: 'Already joined this battle',
      data: { battle }
    });
  }

  // Check password if required
  if (battle.password && (!password || !await comparePassword(password, battle.password))) {
    return next(new AppError('Incorrect battle password', 401, 'INCORRECT_PASSWORD'));
  }

  // Add user to battle
  const success = await battle.addParticipant(userId, `${req.user!.firstName} ${req.user!.lastName}`);

  if (!success) {
    return next(new AppError('Failed to join battle', 500, 'JOIN_FAILED'));
  }

  await battle.populate([
    { path: 'createdBy', select: 'firstName lastName avatar' },
    { path: 'participants.userId', select: 'firstName lastName avatar gamification.level' }
  ]);

  logger.info('User joined battle', {
    battleId,
    userId,
    participantCount: battle.participants.length
  });

  // Emit to real-time system
  const io = req.app.get('io');
  if (io) {
    socketUtils.sendToBattleRoom(io, battleId, 'participant-joined', {
      participant: {
        userId,
        username: `${req.user!.firstName} ${req.user!.lastName}`,
        avatar: req.user!.avatar,
        level: req.user!.gamification.level
      },
      totalParticipants: battle.participants.length
    });
  }

  res.status(200).json({
    success: true,
    message: 'Successfully joined battle',
    data: { battle }
  });
});

export const leaveBattle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { battleId } = req.params;
  const userId = req.user!._id;

  const battle = await Battle.findById(battleId);

  if (!battle) {
    return next(new AppError('Battle not found', 404, 'BATTLE_NOT_FOUND'));
  }

  if (battle.status === 'active') {
    return next(new AppError('Cannot leave an active battle', 400, 'BATTLE_ACTIVE'));
  }

  const participant = battle.participants.find(p => p.userId.equals(userId));
  if (!participant) {
    return next(new AppError('You are not a participant in this battle', 400, 'NOT_PARTICIPANT'));
  }

  await battle.removeParticipant(userId);

  logger.info('User left battle', {
    battleId,
    userId,
    remainingParticipants: battle.participants.length
  });

  // Emit to real-time system
  const io = req.app.get('io');
  if (io) {
    socketUtils.sendToBattleRoom(io, battleId, 'participant-left', {
      userId,
      username: `${req.user!.firstName} ${req.user!.lastName}`,
      totalParticipants: battle.participants.length
    });
  }

  res.status(200).json({
    success: true,
    message: 'Successfully left battle'
  });
});

export const startBattle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { battleId } = req.params;
  const userId = req.user!._id;

  const battle = await Battle.findById(battleId);

  if (!battle) {
    return next(new AppError('Battle not found', 404, 'BATTLE_NOT_FOUND'));
  }

  if (!battle.createdBy.equals(userId)) {
    return next(new AppError('Only the battle creator can start the battle', 403, 'START_DENIED'));
  }

  if (battle.status !== 'waiting') {
    return next(new AppError('Battle cannot be started', 400, 'BATTLE_NOT_STARTABLE'));
  }

  if (battle.participants.length < 2) {
    return next(new AppError('Need at least 2 participants to start battle', 400, 'INSUFFICIENT_PARTICIPANTS'));
  }

  // Check if all participants are ready (optional)
  const allReady = battle.participants.every(p => p.isReady);
  if (!allReady && battle.type !== 'practice') {
    return next(new AppError('All participants must be ready', 400, 'PARTICIPANTS_NOT_READY'));
  }

  await battle.startBattle();

  logger.info('Battle started', {
    battleId,
    startedBy: userId,
    participantCount: battle.participants.length
  });

  // Emit to real-time system
  const io = req.app.get('io');
  if (io) {
    socketUtils.sendToBattleRoom(io, battleId, 'battle-started', {
      battleId,
      startTime: battle.startTime,
      firstQuestion: battle.questions[0]
    });
  }

  res.status(200).json({
    success: true,
    message: 'Battle started successfully',
    data: {
      battle,
      startTime: battle.startTime
    }
  });
});

export const submitBattleAnswer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { battleId } = req.params;
  const { questionId, answer, timeSpent } = req.body;
  const userId = req.user!._id;

  const battle = await Battle.findById(battleId).populate('questions');

  if (!battle) {
    return next(new AppError('Battle not found', 404, 'BATTLE_NOT_FOUND'));
  }

  if (battle.status !== 'active') {
    return next(new AppError('Battle is not active', 400, 'BATTLE_NOT_ACTIVE'));
  }

  const participant = battle.participants.find(p => p.userId.equals(userId));
  if (!participant) {
    return next(new AppError('You are not a participant in this battle', 403, 'NOT_PARTICIPANT'));
  }

  // Verify question belongs to this battle
  const question = battle.questions.find((q: any) => q._id.equals(questionId));
  if (!question) {
    return next(new AppError('Question not part of this battle', 400, 'INVALID_QUESTION'));
  }

  // Check if already answered
  const existingAnswer = participant.answers.find(a => a.questionId.equals(questionId));
  if (existingAnswer) {
    return next(new AppError('Question already answered', 400, 'ALREADY_ANSWERED'));
  }

  // Grade the answer
  const gradingResult = gradeAnswer(question, answer);

  await battle.submitAnswer(userId, {
    questionId,
    answer,
    timeSpent,
    isCorrect: gradingResult.isCorrect,
    points: gradingResult.points
  });

  // Calculate leaderboard
  await battle.calculateLeaderboard();

  logger.info('Battle answer submitted', {
    battleId,
    questionId,
    userId,
    isCorrect: gradingResult.isCorrect,
    points: gradingResult.points
  });

  // Emit to real-time system
  const io = req.app.get('io');
  if (io) {
    socketUtils.sendToBattleRoom(io, battleId, 'answer-submitted', {
      userId,
      questionId,
      isCorrect: gradingResult.isCorrect,
      points: gradingResult.points,
      timeSpent,
      leaderboard: battle.leaderboard
    });
  }

  res.status(200).json({
    success: true,
    message: 'Answer submitted successfully',
    data: {
      isCorrect: gradingResult.isCorrect,
      points: gradingResult.points,
      currentScore: participant.score,
      leaderboard: battle.leaderboard.slice(0, 10) // Top 10
    }
  });
});

export const getBattleLeaderboard = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { battleId } = req.params;

  const battle = await Battle.findById(battleId)
    .populate('participants.userId', 'firstName lastName avatar gamification.level');

  if (!battle) {
    return next(new AppError('Battle not found', 404, 'BATTLE_NOT_FOUND'));
  }

  await battle.calculateLeaderboard();

  res.status(200).json({
    success: true,
    data: {
      leaderboard: battle.leaderboard,
      battleInfo: {
        _id: battle._id,
        title: battle.title,
        status: battle.status,
        totalQuestions: battle.questionCount,
        timeLimit: battle.timeLimit
      }
    }
  });
});

export const endBattle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { battleId } = req.params;
  const userId = req.user!._id;

  const battle = await Battle.findById(battleId);

  if (!battle) {
    return next(new AppError('Battle not found', 404, 'BATTLE_NOT_FOUND'));
  }

  if (!battle.createdBy.equals(userId) && req.user!.role !== 'admin') {
    return next(new AppError('Only the battle creator or admin can end the battle', 403, 'END_DENIED'));
  }

  if (battle.status !== 'active') {
    return next(new AppError('Battle is not active', 400, 'BATTLE_NOT_ACTIVE'));
  }

  await battle.endBattle();

  // Update user statistics and XP
  for (const participant of battle.participants) {
    const user = await User.findById(participant.userId);
    if (user) {
      const xpEarned = calculateBattleXP(participant, battle);
      await user.addXP(xpEarned);
      
      // Update battle statistics
      user.statistics.totalQuestionsAnswered += participant.answers.length;
      await user.save();
    }
  }

  logger.info('Battle ended', {
    battleId,
    endedBy: userId,
    winner: battle.winner,
    participantCount: battle.participants.length
  });

  // Emit to real-time system
  const io = req.app.get('io');
  if (io) {
    socketUtils.sendToBattleRoom(io, battleId, 'battle-ended', {
      battleId,
      winner: battle.winner,
      leaderboard: battle.leaderboard,
      endTime: battle.endTime
    });
  }

  res.status(200).json({
    success: true,
    message: 'Battle ended successfully',
    data: {
      battle,
      results: {
        winner: battle.winner,
        leaderboard: battle.leaderboard,
        duration: battle.duration
      }
    }
  });
});

// Helper functions
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function gradeAnswer(question: any, userAnswer: any) {
  let isCorrect = false;
  let points = 0;

  switch (question.type) {
    case 'mcq':
      isCorrect = parseInt(question.correctAnswer) === parseInt(userAnswer);
      points = isCorrect ? question.points : 0;
      break;
    case 'numerical':
      const correctNum = parseFloat(question.correctAnswer);
      const userNum = parseFloat(userAnswer);
      const tolerance = 0.01;
      isCorrect = Math.abs(correctNum - userNum) <= Math.abs(correctNum * tolerance);
      points = isCorrect ? question.points : 0;
      break;
    default:
      isCorrect = question.correctAnswer.toString().toLowerCase() === userAnswer.toString().toLowerCase();
      points = isCorrect ? question.points : 0;
  }

  return { isCorrect, points };
}

function calculateBattleXP(participant: any, battle: any): number {
  const baseXP = 20; // Base XP for participation
  const correctAnswerXP = 10; // XP per correct answer
  const rankBonus = [50, 30, 20, 10]; // Bonus XP for top 4 positions
  
  let totalXP = baseXP;
  totalXP += participant.performance.correctAnswers * correctAnswerXP;
  
  if (participant.rank && participant.rank <= 4) {
    totalXP += rankBonus[participant.rank - 1] || 0;
  }
  
  return totalXP;
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, 12);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
}