import express from 'express';
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  getExamStats,
  duplicateExam,
  getMyExams
} from '../controllers/exam';
import {
  startExamSession,
  getCurrentQuestion,
  submitAnswer,
  completeExamSession,
  getSessionDetails
} from '../controllers/examSession';
import {
  validateCreateExam,
  validateUpdateExam,
  validateStartExam,
  validateSubmitAnswer,
  validatePagination,
  validateObjectId
} from '../middleware/validation';
import { authenticate, authorize, canTakeExam } from '../middleware/auth';
import { validateRequest } from '../middleware/errorHandler';

const router = express.Router();

// Exam routes
router.get('/', validatePagination, getExams);
router.get('/my-exams', authenticate, validatePagination, getMyExams);
router.get('/:id', validateObjectId('id'), getExam);
router.post('/', authenticate, authorize('instructor', 'admin'), validateCreateExam, validateRequest, createExam);
router.put('/:id', authenticate, authorize('instructor', 'admin'), validateObjectId('id'), validateUpdateExam, validateRequest, updateExam);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), validateObjectId('id'), deleteExam);
router.get('/:id/stats', authenticate, authorize('instructor', 'admin'), validateObjectId('id'), getExamStats);
router.post('/:id/duplicate', authenticate, authorize('instructor', 'admin'), validateObjectId('id'), duplicateExam);

// Exam session routes
router.post('/:examId/start', authenticate, canTakeExam, validateStartExam, validateRequest, startExamSession);

// Session management routes
router.get('/sessions/:sessionId', authenticate, validateObjectId('sessionId'), getSessionDetails);
router.get('/sessions/:sessionId/question', authenticate, validateObjectId('sessionId'), getCurrentQuestion);
router.post('/sessions/:sessionId/submit', authenticate, validateObjectId('sessionId'), validateSubmitAnswer, validateRequest, submitAnswer);
router.post('/sessions/:sessionId/complete', authenticate, validateObjectId('sessionId'), completeExamSession);

export default router;