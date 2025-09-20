import express from 'express';
import multer from 'multer';
import {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
  bulkExportQuestions,
  reviewQuestion,
  getQuestionStats,
  duplicateQuestion
} from '../controllers/question';
import {
  validateCreateQuestion,
  validatePagination,
  validateObjectId,
  validateSearch
} from '../middleware/validation';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/errorHandler';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/questions/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Question CRUD routes
router.get('/', validatePagination, validateSearch, getQuestions);
router.get('/:id', authenticate, validateObjectId('id'), getQuestion);
router.post('/', authenticate, authorize('instructor', 'admin'), validateCreateQuestion, validateRequest, createQuestion);
router.put('/:id', authenticate, authorize('instructor', 'admin'), validateObjectId('id'), validateRequest, updateQuestion);
router.delete('/:id', authenticate, authorize('instructor', 'admin'), validateObjectId('id'), deleteQuestion);

// Bulk operations
router.post('/import', authenticate, authorize('instructor', 'admin'), upload.single('file'), bulkImportQuestions);
router.get('/export/bulk', authenticate, authorize('instructor', 'admin'), bulkExportQuestions);

// Question management
router.put('/:id/review', authenticate, authorize('instructor', 'admin'), validateObjectId('id'), reviewQuestion);
router.get('/:id/stats', authenticate, authorize('instructor', 'admin'), validateObjectId('id'), getQuestionStats);
router.post('/:id/duplicate', authenticate, authorize('instructor', 'admin'), validateObjectId('id'), duplicateQuestion);

export default router;