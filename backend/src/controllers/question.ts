 import { Request, Response, NextFunction } from 'express';
import { Question } from '../models/Question';
import { AppError, catchAsync } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { validationResult } from 'express-validator';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';

export const getQuestions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  const { type, subject, topic, difficulty, reviewStatus, search, sort = '-createdAt' } = req.query;

  const filter: any = { isActive: true };
  
  if (type) filter.type = type;
  if (subject) filter.subject = subject;
  if (topic) filter.topic = topic;
  if (difficulty) filter.difficulty = difficulty;
  if (reviewStatus) filter.reviewStatus = reviewStatus;

  if (req.user!.role !== 'admin') {
    filter.$or = [
      { createdBy: req.user!._id },
      { reviewStatus: 'approved' }
    ];
  }

  if (search) {
    filter.$or = [
      { question: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } },
      { topic: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search as string, 'i')] } }
    ];
  }

  const questions = await Question.find(filter)
    .populate('createdBy', 'firstName lastName')
    .populate('reviewedBy', 'firstName lastName')
    .sort(sort as string)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Question.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      questions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    }
  });
});

export const getQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const question = await Question.findById(req.params.id)
    .populate('createdBy', 'firstName lastName avatar')
    .populate('reviewedBy', 'firstName lastName avatar');

  if (!question) {
    return next(new AppError('Question not found', 404, 'QUESTION_NOT_FOUND'));
  }

  if (req.user!.role !== 'admin' && 
      !question.createdBy.equals(req.user!._id) && 
      question.reviewStatus !== 'approved') {
    return next(new AppError('Access denied to this question', 403, 'QUESTION_ACCESS_DENIED'));
  }

  res.status(200).json({
    success: true,
    data: { question }
  });
});

export const createQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array()));
  }

  const questionData = {
    ...req.body,
    createdBy: req.user!._id,
    lastModifiedBy: req.user!._id,
    reviewStatus: req.user!.role === 'admin' ? 'approved' : 'pending'
  };

  const question = await Question.create(questionData);
  await question.populate('createdBy', 'firstName lastName avatar');

  logger.info('Question created successfully', {
    questionId: question._id,
    type: question.type,
    subject: question.subject,
    createdBy: req.user!._id
  });

  res.status(201).json({
    success: true,
    message: 'Question created successfully',
    data: { question }
  });
});

export const updateQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors.array()));
  }

  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('Question not found', 404, 'QUESTION_NOT_FOUND'));
  }

  if (req.user!.role !== 'admin' && !question.createdBy.equals(req.user!._id)) {
    return next(new AppError('Not authorized to update this question', 403, 'QUESTION_UPDATE_DENIED'));
  }

  const updatedQuestion = await Question.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      lastModifiedBy: req.user!._id,
      version: question.version + 1,
      reviewStatus: req.user!.role === 'admin' ? req.body.reviewStatus || question.reviewStatus : 'pending'
    },
    { new: true, runValidators: true }
  ).populate('createdBy', 'firstName lastName avatar');

  logger.info('Question updated successfully', {
    questionId: question._id,
    updatedBy: req.user!._id,
    version: updatedQuestion!.version
  });

  res.status(200).json({
    success: true,
    message: 'Question updated successfully',
    data: { question: updatedQuestion }
  });
});

export const deleteQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('Question not found', 404, 'QUESTION_NOT_FOUND'));
  }

  if (req.user!.role !== 'admin' && !question.createdBy.equals(req.user!._id)) {
    return next(new AppError('Not authorized to delete this question', 403, 'QUESTION_DELETE_DENIED'));
  }

  question.isActive = false;
  await question.save();

  logger.info('Question deleted successfully', {
    questionId: question._id,
    deletedBy: req.user!._id
  });

  res.status(200).json({
    success: true,
    message: 'Question deleted successfully'
  });
});

export const bulkImportQuestions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new AppError('CSV file is required', 400, 'FILE_REQUIRED'));
  }

  const results: any[] = [];
  const errors: any[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(req.file!.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const questions = [];
          
          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            
            try {
              const questionData = {
                type: row.type,
                subject: row.subject,
                topic: row.topic,
                difficulty: row.difficulty,
                question: row.question,
                correctAnswer: row.correctAnswer,
                explanation: row.explanation,
                estimatedTime: parseInt(row.estimatedTime) || 60,
                points: parseInt(row.points) || 1,
                createdBy: req.user!._id,
                reviewStatus: req.user!.role === 'admin' ? 'approved' : 'pending'
              };

              if (row.type === 'mcq' && row.options) {
                questionData.options = row.options.split('|');
              }

              if (row.tags) {
                questionData.tags = row.tags.split(',').map((tag: string) => tag.trim());
              }

              questions.push(questionData);
            } catch (error) {
              errors.push({
                row: i + 1,
                error: error instanceof Error ? error.message : 'Invalid data format'
              });
            }
          }

          const createdQuestions = await Question.insertMany(questions, { ordered: false });

          // Clean up uploaded file
          fs.unlinkSync(req.file!.path);

          logger.info('Bulk import completed', {
            total: results.length,
            successful: createdQuestions.length,
            errors: errors.length,
            importedBy: req.user!._id
          });

          res.status(200).json({
            success: true,
            message: 'Bulk import completed',
            data: {
              total: results.length,
              successful: createdQuestions.length,
              failed: errors.length,
              errors: errors.slice(0, 10) // Return first 10 errors
            }
          });
        } catch (error) {
          fs.unlinkSync(req.file!.path);
          reject(error);
        }
      })
      .on('error', (error) => {
        fs.unlinkSync(req.file!.path);
        reject(error);
      });
  });
});

export const bulkExportQuestions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { type, subject, topic, difficulty, format = 'csv' } = req.query;

  const filter: any = { isActive: true };
  
  if (type) filter.type = type;
  if (subject) filter.subject = subject;
  if (topic) filter.topic = topic;
  if (difficulty) filter.difficulty = difficulty;

  if (req.user!.role !== 'admin') {
    filter.$or = [
      { createdBy: req.user!._id },
      { reviewStatus: 'approved' }
    ];
  }

  const questions = await Question.find(filter)
    .select('-statistics -createdAt -updatedAt -__v')
    .lean();

  if (format === 'csv') {
    const csvData = questions.map(q => ({
      type: q.type,
      subject: q.subject,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      options: q.options ? q.options.join('|') : '',
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      estimatedTime: q.estimatedTime,
      points: q.points,
      tags: q.tags.join(',')
    }));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=questions.csv');
    
    const csvHeader = Object.keys(csvData[0] || {}).join(',') + '\n';
    const csvRows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
    
    res.send(csvHeader + csvRows);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=questions.json');
    res.json(questions);
  }

  logger.info('Questions exported', {
    count: questions.length,
    format,
    exportedBy: req.user!._id
  });
});

export const reviewQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user!.role !== 'admin' && req.user!.role !== 'instructor') {
    return next(new AppError('Not authorized to review questions', 403, 'REVIEW_ACCESS_DENIED'));
  }

  const { status, comments } = req.body;

  if (!['approved', 'rejected', 'needs_revision'].includes(status)) {
    return next(new AppError('Invalid review status', 400, 'INVALID_STATUS'));
  }

  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('Question not found', 404, 'QUESTION_NOT_FOUND'));
  }

  question.reviewStatus = status;
  question.reviewComments = comments;
  question.reviewedBy = req.user!._id;
  question.reviewedAt = new Date();

  await question.save();

  logger.info('Question reviewed', {
    questionId: question._id,
    status,
    reviewedBy: req.user!._id
  });

  res.status(200).json({
    success: true,
    message: 'Question review completed',
    data: { question }
  });
});

export const getQuestionStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const question = await Question.findById(req.params.id);

  if (!question) {
    return next(new AppError('Question not found', 404, 'QUESTION_NOT_FOUND'));
  }

  if (req.user!.role !== 'admin' && !question.createdBy.equals(req.user!._id)) {
    return next(new AppError('Not authorized to view question statistics', 403, 'QUESTION_STATS_DENIED'));
  }

  const stats = {
    timesUsed: question.statistics.timesUsed,
    timesAnswered: question.statistics.timesAnswered,
    correctAnswers: question.statistics.correctAnswers,
    successRate: question.successRate,
    averageTime: question.statistics.averageTime,
    difficultyRating: question.statistics.difficultyRating,
    usageFrequency: question.usageFrequency,
    lastUsed: question.statistics.lastUsed
  };

  res.status(200).json({
    success: true,
    data: {
      question: {
        _id: question._id,
        question: question.question,
        type: question.type,
        subject: question.subject,
        topic: question.topic,
        difficulty: question.difficulty
      },
      statistics: stats
    }
  });
});

export const duplicateQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const originalQuestion = await Question.findById(req.params.id);

  if (!originalQuestion) {
    return next(new AppError('Question not found', 404, 'QUESTION_NOT_FOUND'));
  }

  if (req.user!.role !== 'admin' && 
      !originalQuestion.createdBy.equals(req.user!._id) && 
      originalQuestion.reviewStatus !== 'approved') {
    return next(new AppError('Not authorized to duplicate this question', 403, 'QUESTION_DUPLICATE_DENIED'));
  }

  const duplicateData = originalQuestion.toObject();
  delete duplicateData._id;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;
  
  duplicateData.question = `${originalQuestion.question} (Copy)`;
  duplicateData.createdBy = req.user!._id;
  duplicateData.lastModifiedBy = req.user!._id;
  duplicateData.version = 1;
  duplicateData.reviewStatus = req.user!.role === 'admin' ? 'approved' : 'pending';
  duplicateData.statistics = {
    timesUsed: 0,
    timesAnswered: 0,
    correctAnswers: 0,
    averageTime: 0,
    averageScore: 0,
    lastUsed: new Date(),
    difficultyRating: 0
  };

  const duplicatedQuestion = await Question.create(duplicateData);
  await duplicatedQuestion.populate('createdBy', 'firstName lastName avatar');

  logger.info('Question duplicated successfully', {
    originalQuestionId: originalQuestion._id,
    duplicatedQuestionId: duplicatedQuestion._id,
    createdBy: req.user!._id
  });

  res.status(201).json({
    success: true,
    message: 'Question duplicated successfully',
    data: { question: duplicatedQuestion }
  });
});