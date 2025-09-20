import express from 'express';
import { authenticate, authorize } from '@/middleware/auth';

const router = express.Router();

// Placeholder routes
router.get('/', authenticate, authorize('admin'), (req, res) => {
  res.json({ success: true, message: 'Admin route' });
});

export default router;