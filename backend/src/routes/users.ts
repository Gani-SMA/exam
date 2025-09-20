import express from 'express';
import { authenticate, authorize } from '@/middleware/auth';

const router = express.Router();

// Placeholder routes
router.get('/', authenticate, (req, res) => {
  res.json({ success: true, message: 'Users route' });
});

export default router;