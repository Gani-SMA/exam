import express from 'express';
import {
  generateQuestions,
  scoreEssay,
  detectPlagiarism,
  generateExplanation,
  getPersonalizedRecommendations
} from '../controllers/ai';
import { authenticate, authorize, userRateLimit } from '../middleware/auth';
import { validateRequest } from '../middleware/errorHandler';
import { body } from 'express-validator';

const router = express.Router();

router.post('/generate-questions', 
  authenticate, 
  authorize('instructor', 'admin'),
  userRateLimit(10, 60 * 60 * 1000),
  [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('topic').notEmpty().withMessage('Topic is required'),
    body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
    body('type').isIn(['mcq', 'numerical', 'essay']).withMessage('Invalid question type'),
    body('count').isInt({ min: 1, max: 20 }).withMessage('Count must be between 1 and 20')
  ],
  validateRequest,
  generateQuestions
);

router.post('/score-essay',
  authenticate,
  userRateLimit(20, 60 * 60 * 1000),
  [
    body('essay').notEmpty().isLength({ min: 50, max: 10000 }).withMessage('Essay must be 50-10000 characters'),
    body('maxScore').optional().isInt({ min: 1, max: 100 }).withMessage('Max score must be 1-100')
  ],
  validateRequest,
  scoreEssay
);

router.post('/detect-plagiarism',
  authenticate,
  userRateLimit(15, 60 * 60 * 1000),
  [
    body('text').notEmpty().isLength({ min: 10 }).withMessage('Text is required (min 10 characters)'),
    body('referenceTexts').optional().isArray().withMessage('Reference texts must be an array')
  ],
  validateRequest,
  detectPlagiarism
);

router.post('/generate-explanation',
  authenticate,
  userRateLimit(30, 60 * 60 * 1000),
  [
    body('questionId').isMongoId().withMessage('Valid question ID required'),
    body('userAnswer').notEmpty().withMessage('User answer is required'),
    body('correctAnswer').notEmpty().withMessage('Correct answer is required')
  ],
  validateRequest,
  generateExplanation
);

router.get('/recommendations',
  authenticate,
  userRateLimit(5, 60 * 60 * 1000),
  getPersonalizedRecommendations
);

export default router;