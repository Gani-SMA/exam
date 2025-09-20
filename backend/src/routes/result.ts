import express from 'express';
import { ExamSession } from '../models/ExamSession';
import { Exam } from '../models/Exam';
import { Question } from '../models/Question';
import { AppError, catchAsync } from '../middleware/errorHandler';
import { authenticate, authorizeOwnerOrAdmin } from '../middleware/auth';
import { validateObjectId, validatePagination } from '../middleware/validation';

const router = express.Router();

const getResults = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const { examType, status, fromDate, toDate } = req.query;

  const filter: any = { userId: req.user!._id };
  
  if (status) filter.status = status;
  if (fromDate) filter.createdAt = { $gte: new Date(fromDate as string) };
  if (toDate) filter.createdAt = { ...filter.createdAt, $lte: new Date(toDate as string) };

  const pipeline: any[] = [
    { $match: filter },
    {
      $lookup: {
        from: 'exams',
        localField: 'examId',
        foreignField: '_id',
        as: 'exam'
      }
    },
    { $unwind: '$exam' }
  ];

  if (examType) {
    pipeline.push({ $match: { 'exam.type': examType } });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        examId: 1,
        status: 1,
        startTime: 1,
        endTime: 1,
        actualDuration: 1,
        score: 1,
        attemptNumber: 1,
        createdAt: 1,
        'exam.title': 1,
        'exam.type': 1,
        'exam.category': 1,
        'exam.passingScore': 1
      }
    }
  );

  const [results, totalCount] = await Promise.all([
    ExamSession.aggregate(pipeline),
    ExamSession.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    data: {
      results,
      pagination: { page, limit, total: totalCount, pages: Math.ceil(totalCount / limit) }
    }
  });
});

const getResult = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await ExamSession.findById(sessionId)
    .populate('examId', 'title type category passingScore settings')
    .populate('questions', 'question type options correctAnswer explanation points');

  if (!session) {
    return next(new AppError('Result not found', 404, 'RESULT_NOT_FOUND'));
  }

  if (!session.userId.equals(req.user!._id) && req.user!.role !== 'admin') {
    return next(new AppError('Access denied to this result', 403, 'RESULT_ACCESS_DENIED'));
  }

  // Calculate detailed analysis
  const analysis = {
    timeAnalysis: {
      totalTime: session.actualDuration,
      averageTimePerQuestion: session.actualDuration / session.questions.length,
      timeDistribution: session.answers.map(a => ({
        questionId: a.questionId,
        timeSpent: a.timeSpent,
        efficiency: a.timeSpent / (session.questions.find((q: any) => q._id.equals(a.questionId))?.estimatedTime || 60)
      }))
    },
    accuracyAnalysis: {
      overall: session.score.percentage,
      byDifficulty: calculateAccuracyByDifficulty(session),
      bySubject: calculateAccuracyBySubject(session)
    },
    recommendations: generateRecommendations(session)
  };

  res.status(200).json({
    success: true,
    data: {
      session,
      analysis
    }
  });
});

const getDetailedReport = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await ExamSession.findById(sessionId)
    .populate('examId')
    .populate('questions');

  if (!session) {
    return next(new AppError('Session not found', 404, 'SESSION_NOT_FOUND'));
  }

  if (!session.userId.equals(req.user!._id) && req.user!.role !== 'admin') {
    return next(new AppError('Access denied', 403, 'ACCESS_DENIED'));
  }

  const detailedReport = {
    examInfo: {
      title: (session.examId as any).title,
      type: (session.examId as any).type,
      duration: (session.examId as any).duration,
      totalQuestions: session.questions.length
    },
    performance: {
      score: session.score,
      timeSpent: session.actualDuration,
      efficiency: (session.actualDuration / (session.examId as any).duration) * 100
    },
    questionAnalysis: session.answers.map(answer => {
      const question = session.questions.find((q: any) => q._id.equals(answer.questionId));
      return {
        questionId: answer.questionId,
        question: question?.question,
        type: question?.type,
        difficulty: question?.difficulty,
        userAnswer: answer.answer,
        correctAnswer: question?.correctAnswer,
        isCorrect: answer.isCorrect,
        points: answer.points,
        timeSpent: answer.timeSpent,
        explanation: question?.explanation
      };
    }),
    strengths: identifyStrengths(session),
    weaknesses: identifyWeaknesses(session),
    recommendations: generateDetailedRecommendations(session)
  };

  res.status(200).json({
    success: true,
    data: { report: detailedReport }
  });
});

const compareResults = catchAsync(async (req, res, next) => {
  const { sessionIds } = req.body;

  if (!Array.isArray(sessionIds) || sessionIds.length < 2) {
    return next(new AppError('At least 2 session IDs required for comparison', 400, 'INVALID_SESSIONS'));
  }

  const sessions = await ExamSession.find({
    _id: { $in: sessionIds },
    userId: req.user!._id
  }).populate('examId', 'title type');

  if (sessions.length !== sessionIds.length) {
    return next(new AppError('Some sessions not found or access denied', 404, 'SESSIONS_NOT_FOUND'));
  }

  const comparison = {
    sessions: sessions.map(s => ({
      sessionId: s._id,
      examTitle: (s.examId as any).title,
      score: s.score.percentage,
      duration: s.actualDuration,
      date: s.createdAt
    })),
    trends: {
      scoreImprovement: calculateScoreTrend(sessions),
      timeImprovement: calculateTimeTrend(sessions),
      consistencyAnalysis: calculateConsistency(sessions)
    }
  };

  res.status(200).json({
    success: true,
    data: { comparison }
  });
});

// Helper functions
function calculateAccuracyByDifficulty(session: any) {
  const difficulties = ['easy', 'medium', 'hard'];
  return difficulties.map(diff => {
    const questionsOfDifficulty = session.questions.filter((q: any) => q.difficulty === diff);
    const correctAnswers = session.answers.filter(a => 
      a.isCorrect && questionsOfDifficulty.some((q: any) => q._id.equals(a.questionId))
    ).length;
    
    return {
      difficulty: diff,
      total: questionsOfDifficulty.length,
      correct: correctAnswers,
      accuracy: questionsOfDifficulty.length > 0 ? (correctAnswers / questionsOfDifficulty.length) * 100 : 0
    };
  });
}

function calculateAccuracyBySubject(session: any) {
  const subjects = [...new Set(session.questions.map((q: any) => q.subject))];
  return subjects.map(subject => {
    const questionsOfSubject = session.questions.filter((q: any) => q.subject === subject);
    const correctAnswers = session.answers.filter(a => 
      a.isCorrect && questionsOfSubject.some((q: any) => q._id.equals(a.questionId))
    ).length;
    
    return {
      subject,
      total: questionsOfSubject.length,
      correct: correctAnswers,
      accuracy: questionsOfSubject.length > 0 ? (correctAnswers / questionsOfSubject.length) * 100 : 0
    };
  });
}

function generateRecommendations(session: any): string[] {
  const recommendations = [];
  
  if (session.score.percentage < 60) {
    recommendations.push('Focus on fundamental concepts and practice more questions');
  }
  
  if (session.actualDuration > (session.examId as any).duration * 0.9) {
    recommendations.push('Work on time management and speed');
  }
  
  return recommendations;
}

function identifyStrengths(session: any): string[] {
  return ['Strong analytical skills', 'Good time management'];
}

function identifyWeaknesses(session: any): string[] {
  return ['Need improvement in calculation speed', 'Review basic concepts'];
}

function generateDetailedRecommendations(session: any): string[] {
  return [
    'Practice more questions on weak topics',
    'Review incorrect answers and explanations',
    'Take more mock tests to improve speed'
  ];
}

function calculateScoreTrend(sessions: any[]): number {
  if (sessions.length < 2) return 0;
  const sorted = sessions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return sorted[sorted.length - 1].score.percentage - sorted[0].score.percentage;
}

function calculateTimeTrend(sessions: any[]): number {
  if (sessions.length < 2) return 0;
  const sorted = sessions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return sorted[0].actualDuration - sorted[sorted.length - 1].actualDuration;
}

function calculateConsistency(sessions: any[]): number {
  if (sessions.length < 2) return 100;
  const scores = sessions.map(s => s.score.percentage);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
  return Math.max(0, 100 - Math.sqrt(variance));
}

router.get('/', authenticate, validatePagination, getResults);
router.get('/:sessionId', authenticate, validateObjectId('sessionId'), getResult);
router.get('/:sessionId/report', authenticate, validateObjectId('sessionId'), getDetailedReport);
router.post('/compare', authenticate, compareResults);

export default router;