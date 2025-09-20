import { Request, Response, NextFunction } from 'express';
import { Exam, IExam } from '../models/Exam';
import { Question } from '../models/Question';
import { ExamSession } from '../models/ExamSession';
import { AppError, catchAsync } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

/**
 * @desc    Get all exams
 * @route   GET /api/exams
 * @access  Public/Private (based on exam visibility)
 */
export const getExams = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const {
    type,
    category,
    subject,
    difficulty,
    isPublic,
    search,
    sort = '-createdAt'
  } = req.query;

  // Build filter object
  const filter: any = { isActive: true };
  
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (subject) filter.subject = subject;
  if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
  
  // If user is not authenticated, only show public exams
  if (!req.user) {
    filter.isPublic = true;
  } else if (req.user.role !== 'admin') {
    // For non-admin users, show public exams or their own exams
    filter.$or = [
      { isPublic: true },
      { createdBy: req.user._id },
      { allowedUsers: req.user._id }
    ];
  }

  // Add search functionality
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } }
    ];
  }

  const exams = await Exam.find(filter)
    .populate('createdBy', 'firstName lastName avatar')
    .sort(sort as string)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Exam.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      exams,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

/**
 * @desc    Get single exam
 * @route   GET /api/exams/:id
 * @access  Public/Private
 */
export const getExam = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const exam = await Exam.findById(req.params.id)
    .populate('createdBy', 'firstName lastName avatar')
    .populate('questions', 'type subject topic difficulty estimatedTime points');

  if (!exam) {
    return next(new AppError('Exam not found', 404, 'EXAM_NOT_FOUND'));
  }

  // Check access permissions
  if (!exam.isPublic && (!req.user || 
      (req.user.role !== 'admin' && 
       !exam.createdBy.equals(req.user._id) && 
       !exam.allowedUsers.includes(req.user._id)))) {
    return next(new AppError('Access denied to this exam', 403, 'EXAM_ACCESS_DENIED'));
  }

  // Check if exam is scheduled and not yet available
  if (exam.isScheduled && exam.scheduledStart && new Date() < exam.scheduledStart) {
    return next(new AppError('Exam is not yet available', 403, 'EXAM_NOT_AVAILABLE'));
  }

  // Get user's previous attempts if authenticated
  let userAttempts = 0;
  let lastAttempt = null;
  
  if (req.user) {
    const sessions = await ExamSession.find({
      examId: exam._id,
      userId: req.user._id
    }).sort({ createdAt: -1 });
    
    userAttempts = sessions.length;
    lastAttempt = sessions[0] || null;
  }

  res.status(200).json({
    success: true,
    data: {
      exam,
      userStats: req.user ? {
        attempts: userAttempts,
        maxAttempts: exam.maxAttempts,
        canTakeExam: userAttempts < exam.maxAttempts,
        lastAttempt
      } : null
    }
  });
});

/**
 * @desc    Create exam
 * @route   POST /api/exams
 * @access  Private (Instructor/Admin)
 */
export const createExam = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array()));
  }

  const examData = {
    ...req.body,
    createdBy: req.user!._id,
    lastModifiedBy: req.user!._id
  };

  // Validate questions exist if provided
  if (examData.questions && examData.questions.length > 0) {
    const questionCount = await Question.countDocuments({
      _id: { $in: examData.questions },
      isActive: true
    });
    
    if (questionCount !== examData.questions.length) {
      return next(new AppError('Some questions are invalid or inactive', 400, 'INVALID_QUESTIONS'));
    }
  }

  const exam = await Exam.create(examData);
  
  await exam.populate('createdBy', 'firstName lastName avatar');

  logger.info('Exam created successfully', {
    examId: exam._id,
    title: exam.title,
    createdBy: req.user!._id,
    type: exam.type
  });

  res.status(201).json({
    success: true,
    message: 'Exam created successfully',
    data: {
      exam
    }
  });
});

/**
 * @desc    Update exam
 * @route   PUT /api/exams/:id
 * @access  Private (Owner/Admin)
 */
export const updateExam = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array()));
  }

  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return next(new AppError('Exam not found', 404, 'EXAM_NOT_FOUND'));
  }

  // Check permissions
  if (req.user!.role !== 'admin' && !exam.createdBy.equals(req.user!._id)) {
    return next(new AppError('Not authorized to update this exam', 403, 'EXAM_UPDATE_DENIED'));
  }

  // Check if exam has active sessions
  const activeSessions = await ExamSession.countDocuments({
    examId: exam._id,
    status: { $in: ['active', 'paused'] }
  });

  if (activeSessions > 0) {
    return next(new AppError('Cannot update exam with active sessions', 400, 'EXAM_HAS_ACTIVE_SESSIONS'));
  }

  // Update exam
  const updatedExam = await Exam.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      lastModifiedBy: req.user!._id,
      version: exam.version + 1
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy', 'firstName lastName avatar');

  logger.info('Exam updated successfully', {
    examId: exam._id,
    updatedBy: req.user!._id,
    version: updatedExam!.version
  });

  res.status(200).json({
    success: true,
    message: 'Exam updated successfully',
    data: {
      exam: updatedExam
    }
  });
});

/**
 * @desc    Delete exam
 * @route   DELETE /api/exams/:id
 * @access  Private (Owner/Admin)
 */
export const deleteExam = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return next(new AppError('Exam not found', 404, 'EXAM_NOT_FOUND'));
  }

  // Check permissions
  if (req.user!.role !== 'admin' && !exam.createdBy.equals(req.user!._id)) {
    return next(new AppError('Not authorized to delete this exam', 403, 'EXAM_DELETE_DENIED'));
  }

  // Check if exam has any sessions
  const sessionCount = await ExamSession.countDocuments({ examId: exam._id });
  
  if (sessionCount > 0) {
    // Soft delete - mark as inactive instead of hard delete
    exam.isActive = false;
    await exam.save();
    
    logger.info('Exam soft deleted (has sessions)', {
      examId: exam._id,
      deletedBy: req.user!._id,
      sessionCount
    });
    
    return res.status(200).json({
      success: true,
      message: 'Exam deactivated successfully (has existing sessions)'
    });
  }

  // Hard delete if no sessions
  await Exam.findByIdAndDelete(req.params.id);

  logger.info('Exam deleted successfully', {
    examId: exam._id,
    deletedBy: req.user!._id
  });

  res.status(200).json({
    success: true,
    message: 'Exam deleted successfully'
  });
});

/**
 * @desc    Get exam statistics
 * @route   GET /api/exams/:id/stats
 * @access  Private (Owner/Admin)
 */
export const getExamStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    return next(new AppError('Exam not found', 404, 'EXAM_NOT_FOUND'));
  }

  // Check permissions
  if (req.user!.role !== 'admin' && !exam.createdBy.equals(req.user!._id)) {
    return next(new AppError('Not authorized to view exam statistics', 403, 'EXAM_STATS_DENIED'));
  }

  // Get comprehensive statistics
  const [
    totalAttempts,
    completedSessions,
    averageScore,
    scoreDistribution,
    timeStats,
    recentSessions
  ] = await Promise.all([
    ExamSession.countDocuments({ examId: exam._id }),
    ExamSession.countDocuments({ examId: exam._id, status: 'completed' }),
    ExamSession.aggregate([
      { $match: { examId: exam._id, status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$score.percentage' } } }
    ]),
    ExamSession.aggregate([
      { $match: { examId: exam._id, status: 'completed' } },
      {
        $bucket: {
          groupBy: '$score.percentage',
          boundaries: [0, 20, 40, 60, 80, 100],
          default: 'other',
          output: { count: { $sum: 1 } }
        }
      }
    ]),
    ExamSession.aggregate([
      { $match: { examId: exam._id, status: 'completed' } },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$actualDuration' },
          minDuration: { $min: '$actualDuration' },
          maxDuration: { $max: '$actualDuration' }
        }
      }
    ]),
    ExamSession.find({ examId: exam._id })
      .populate('userId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
  ]);

  const stats = {
    totalAttempts,
    completedAttempts: completedSessions,
    completionRate: totalAttempts > 0 ? (completedSessions / totalAttempts) * 100 : 0,
    averageScore: averageScore[0]?.avgScore || 0,
    scoreDistribution,
    timeStatistics: timeStats[0] || { avgDuration: 0, minDuration: 0, maxDuration: 0 },
    recentSessions
  };

  res.status(200).json({
    success: true,
    data: {
      exam: {
        _id: exam._id,
        title: exam.title,
        type: exam.type
      },
      statistics: stats
    }
  });
});

/**
 * @desc    Duplicate exam
 * @route   POST /api/exams/:id/duplicate
 * @access  Private (Instructor/Admin)
 */
export const duplicateExam = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const originalExam = await Exam.findById(req.params.id);

  if (!originalExam) {
    return next(new AppError('Exam not found', 404, 'EXAM_NOT_FOUND'));
  }

  // Check permissions
  if (!originalExam.isPublic && req.user!.role !== 'admin' && 
      !originalExam.createdBy.equals(req.user!._id) && 
      !originalExam.allowedUsers.includes(req.user!._id)) {
    return next(new AppError('Not authorized to duplicate this exam', 403, 'EXAM_DUPLICATE_DENIED'));
  }

  // Create duplicate
  const duplicateData = originalExam.toObject();
  delete duplicateData._id;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;
  
  duplicateData.title = `${originalExam.title} (Copy)`;
  duplicateData.createdBy = req.user!._id;
  duplicateData.lastModifiedBy = req.user!._id;
  duplicateData.version = 1;
  duplicateData.analytics = {
    totalAttempts: 0,
    averageScore: 0,
    averageTime: 0,
    completionRate: 0,
    difficultyRating: 0
  };

  const duplicatedExam = await Exam.create(duplicateData);
  await duplicatedExam.populate('createdBy', 'firstName lastName avatar');

  logger.info('Exam duplicated successfully', {
    originalExamId: originalExam._id,
    duplicatedExamId: duplicatedExam._id,
    createdBy: req.user!._id
  });

  res.status(201).json({
    success: true,
    message: 'Exam duplicated successfully',
    data: {
      exam: duplicatedExam
    }
  });
});

/**
 * @desc    Get user's exam history
 * @route   GET /api/exams/my-exams
 * @access  Private
 */
export const getMyExams = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const { status, type } = req.query;

  // Get user's exam sessions with exam details
  const pipeline: any[] = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(req.user!._id),
        ...(status && { status }),
      }
    },
    {
      $lookup: {
        from: 'exams',
        localField: 'examId',
        foreignField: '_id',
        as: 'exam'
      }
    },
    {
      $unwind: '$exam'
    },
    {
      $match: {
        'exam.isActive': true,
        ...(type && { 'exam.type': type })
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        _id: 1,
        status: 1,
        startTime: 1,
        endTime: 1,
        score: 1,
        attemptNumber: 1,
        createdAt: 1,
        'exam._id': 1,
        'exam.title': 1,
        'exam.type': 1,
        'exam.category': 1,
        'exam.duration': 1,
        'exam.totalQuestions': 1,
        'exam.passingScore': 1
      }
    }
  ];

  const [sessions, totalCount] = await Promise.all([
    ExamSession.aggregate(pipeline),
    ExamSession.aggregate([
      ...pipeline.slice(0, -3), // Remove skip, limit, and project
      { $count: 'total' }
    ])
  ]);

  const total = totalCount[0]?.total || 0;

  res.status(200).json({
    success: true,
    data: {
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});