import express from 'express';
import {
  getGlobalLeaderboard,
  getSubjectLeaderboard,
  getBattleLeaderboard,
  getUserRank,
  getLeaderboardStats
} from '../controllers/leaderboard';
import { validatePagination } from '../middleware/validation';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = express.Router();

router.get('/global', optionalAuth, validatePagination, getGlobalLeaderboard);
router.get('/subject/:subject', optionalAuth, validatePagination, getSubjectLeaderboard);
router.get('/battle', optionalAuth, validatePagination, getBattleLeaderboard);
router.get('/my-rank', authenticate, getUserRank);
router.get('/stats', getLeaderboardStats);

export default router;