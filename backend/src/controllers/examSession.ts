import { Request, Response, NextFunction } from 'express';
import { ExamSession } from '../models/ExamSession';
import { Exam } from '../models/Exam';
import { Question } from '../models/Question';
import { User } from '../models/User';
import { AppError, catchAsync } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export const startExamSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { examId } = req.params;
  const userId = req.user!._id;

  const exam = await Exam.findById(examId).populate('questions');
  if (!exam || !exam.isActive) {
    return next(new AppError('Exam not found or inactive', 404, 'EXAM_NOT_FOUND'));
  }

  const previousAttempts = await ExamSession.countDocuments({
    examId, userId, status: { $in: ['completed', 'expired'] }
  });

  if (previousAttempts >= exam.maxAttempts) {
    return next(new AppError('Maximum attempts exceeded', 400, 'MAX_ATTEMPTS_EXCEEDED'));
  }

  const existingSession = await ExamSession.findOne({
    examId, userId, status: { $in: ['active', 'paused'] }
  });

  if (existingSession) {
    return res.status(200).json({
      success: true,
      message: 'Existing session found',
      data: { session: existingSession, canResume: true }
    });
  }

  let selectedQuestions = [...exam.questions];
  if (exam.settings.shuffleQuestions) {
    selectedQuestions = shuffleArray(selectedQuestions);
  }
  if (exam.totalQuestions < selectedQuestions.length) {
    selectedQuestions = selectedQuestions.slice(0, exam.totalQuestions);
  }

  const session = await ExamSession.create({
    examId, userId,
    questions: selectedQuestions,
    currentQuestionIndex: 0,
    attemptNumber: previousAttempts + 1,
    maxAttempts: exam.maxAttempts,
    browserInfo: {
      userAgent: req.get('User-Agent') || '',
      platform: req.body.platform || 'unknown',
      language: req.body.language || 'en',
      screenResolution: req.body.screenResolution || 'unknown',
      timezone: req.body.timezone || 'UTC'
    },
    networkInfo: {
      ipAddress: req.ip || 'unknown',
      location: req.body.location || {}
    },
    proctoring: { enabled: exam.settings.proctoring.enabled, violations: [] },
    score: {
      total: 0, percentage: 0,
      maxPossible: selectedQuestions.reduce((sum, q: any) => sum + (q.points || 1), 0),
      breakdown: { correct: 0, incorrect: 0, unanswered: selectedQuestions.length, flagged: 0 }
    }
  });

  await Promise.all([
    User.findByIdAndUpdate(userId, { $inc: { 'statistics.totalExamsTaken': 1 }, lastActivity: new Date() }),
    Exam.findByIdAndUpdate(examId, { $inc: { 'analytics.totalAttempts': 1 } })
  ]);

  logger.info('Exam session started', { sessionId: session._id, examId, userId });

  res.status(201).json({
    success: true,
    message: 'Exam session started successfully',
    data: { session, timeRemaining: exam.duration * 60 }
  });
});

export const getCurrentQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const session = await ExamSession.findOne({
    _id: sessionId, userId: req.user!._id, status: { $in: ['active', 'paused'] }
  }).populate('examId');

  if (!session) {
    return next(new AppError('Session not found', 404, 'SESSION_NOT_FOUND'));
  }

  const exam = session.examId as any;
  const sessionDuration = (Date.now() - session.startTime.getTime()) / 1000 / 60;
  
  if (sessionDuration > exam.duration) {
    session.status = 'expired';
    await session.save();
    return next(new AppError('Session has expired', 400, 'SESSION_EXPIRED'));
  }

  const currentQuestionId = session.questions[session.currentQuestionIndex];
  const question = await Question.findById(currentQuestionId);

  if (!question) {
    return next(new AppError('Question not found', 404, 'QUESTION_NOT_FOUND'));
  }

  const existingAnswer = session.answers.find(answer => answer.questionId.equals(currentQuestionId));
  const questionData = {
    _id: question._id, type: question.type, subject: question.subject,
    topic: question.topic, difficulty: question.difficulty, question: question.question,
    options: question.options, attachments: question.attachments,
    estimatedTime: question.estimatedTime, points: question.points, settings: question.settings
  };

  const timeRemaining = Math.max(0, (exam.duration * 60) - sessionDuration * 60);

  res.status(200).json({
    success: true,
    data: {
      question: questionData,
      questionNumber: session.currentQuestionIndex + 1,
      totalQuestions: session.questions.length,
      timeRemaining: Math.floor(timeRemaining),
      existingAnswer: existingAnswer ? {
        answer: existingAnswer.answer,
        timeSpent: existingAnswer.timeSpent,
        flagged: existingAnswer.flagged
      } : null,
      navigation: {
        canGoBack: exam.settings.allowBackNavigation && session.currentQuestionIndex > 0,
        canGoNext: session.currentQuestionIndex < session.questions.length - 1,
        visitedQuestions: session.visitedQuestions,
        flaggedQuestions: session.flaggedQuestions
      }
    }
  });
});

export const submitAnswer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const { questionId, answer, timeSpent, flagged = false } = req.body;

  const session = await ExamSession.findOne({
    _id: sessionId, userId: req.user!._id, status: 'active'
  }).populate(['examId', 'questions']);

  if (!session) {
    return next(new AppError('Active session not found', 404, 'SESSION_NOT_FOUND'));
  }

  const questionExists = session.questions.some((q: any) => q._id.equals(questionId));
  if (!questionExists) {
    return next(new AppError('Question not part of this session', 400, 'INVALID_QUESTION'));
  }

  const question = await Question.findById(questionId);
  if (!question) {
    return next(new AppError('Question not found', 404, 'QUESTION_NOT_FOUND'));
  }

  const gradingResult = gradeAnswer(question, answer);

  session.answers = session.answers.filter(ans => !ans.questionId.equals(questionId));
  session.answers.push({
    questionId: new mongoose.Types.ObjectId(questionId),
    answer, timeSpent, submittedAt: new Date(),
    isCorrect: gradingResult.isCorrect,
    points: gradingResult.points,
    partialCredit: gradingResult.partialCredit,
    flagged
  });

  if (!session.visitedQuestions.includes(session.currentQuestionIndex)) {
    session.visitedQuestions.push(session.currentQuestionIndex);
  }

  if (flagged && !session.flaggedQuestions.includes(session.currentQuestionIndex)) {
    session.flaggedQuestions.push(session.currentQuestionIndex);
  } else if (!flagged) {
    session.flaggedQuestions = session.flaggedQuestions.filter(idx => idx !== session.currentQuestionIndex);
  }

  await session.save();
  await question.updateStatistics(gradingResult.isCorrect, timeSpent, gradingResult.points);
  await User.findByIdAndUpdate(req.user!._id, {
    $inc: { 
      'statistics.totalQuestionsAnswered': 1,
      'statistics.totalStudyTime': Math.ceil(timeSpent / 60)
    },
    lastActivity: new Date()
  });

  logger.info('Answer submitted', { sessionId, questionId, userId: req.user!._id, isCorrect: gradingResult.isCorrect });

  res.status(200).json({
    success: true,
    message: 'Answer submitted successfully',
    data: {
      isCorrect: gradingResult.isCorrect,
      points: gradingResult.points,
      partialCredit: gradingResult.partialCredit,
      explanation: gradingResult.explanation,
      progress: {
        answered: session.answers.length,
        total: session.questions.length,
        percentage: Math.round((session.answers.length / session.questions.length) * 100)
      }
    }
  });
});

export const completeExamSession = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { sessionId } = req.params;
  const session = await ExamSession.findOne({
    _id: sessionId, userId: req.user!._id, status: { $in: ['active', 'paused'] }
  }).populate(['examId', 'questions']);

  if (!session) {
    return next(new AppError('Session not found', 404, 'SESSION_NOT_FOUND'));
  }

  await session.completeSession();

  const user = await User.findById(req.user!._id);
  if (user) {
    const totalExams = user.statistics.totalExamsTaken;
    const currentAvg = user.statistics.averageScore;
    const newAvg = ((currentAvg * (totalExams - 1)) + session.score.percentage) / totalExams;
    
    user.statistics.averageScore = newAvg;
    await user.save();
    await user.updateStreak();

    const baseXP = parseInt(process.env.BASE_XP_PER_CORRECT_ANSWER || '10');
    const bonusMultiplier = parseFloat(process.env.BONUS_XP_MULTIPLIER || '1.5');
    let xpEarned = session.score.breakdown.correct * baseXP;
    
    if (session.score.percentage >= 90) {
      xpEarned = Math.floor(xpEarned * bonusMultiplier);
    }
    
    await user.addXP(xpEarned);
  }

  const exam = session.examId as any;
  const [avgScore, avgTime] = await Promise.all([
    ExamSession.aggregate([
      { $match: { examId: exam._id, status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$score.percentage' } } }
    ]),
    ExamSession.aggregate([
      { $match: { examId: exam._id, status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$actualDuration' } } }
    ])
  ]);

  const completedSessions = await ExamSession.countDocuments({ examId: exam._id, status: 'completed' });
  
  await Exam.findByIdAndUpdate(exam._id, {
    'analytics.averageScore': avgScore[0]?.avg || 0,
    'analytics.averageTime': avgTime[0]?.avg || 0,
    'analytics.completionRate': (completedSessions / exam.analytics.totalAttempts) * 100
  });

  logger.info('Exam session completed', { sessionId, userId: req.user!._id, score: session.score.percentage });

  res.status(200).json({
    success: true,
    message: 'Exam completed successfully',
    data: {
      session,
      results: {
        score: session.score,
        duration: session.actualDuration,
        rank: await calculateUserRank(exam._id, session.score.percentage),
        passed: session.score.percentage >= exam.passingScore
      }
    }
  });
});

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
  let partialCredit = 0;
  const explanation = question.explanation || '';

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
    case 'essay':
      isCorrect = true;
      points = question.points;
      partialCredit = 100;
      break;
    default:
      isCorrect = question.correctAnswer.toString().toLowerCase() === userAnswer.toString().toLowerCase();
      points = isCorrect ? question.points : 0;
  }

  return { isCorrect, points, partialCredit, explanation };
}

async function calculateUserRank(examId: mongoose.Types.ObjectId, userScore: number): Promise<number> {
  const betterScores = await ExamSession.countDocuments({
    examId, status: 'completed', 'score.percentage': { $gt: userScore }
  });
  return betterScores + 1;
}