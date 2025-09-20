import express from 'express';
import {
  getBattles,
  getBattle,
  createBattle,
  joinBattle,
  leaveBattle,
  startBattle,
  submitBattleAnswer,
  getBattleLeaderboard,
  endBattle
} from '../controllers/battle';
import { validateCreateBattle, validatePagination, validateObjectId } from '../middleware/validation';
import { authenticate, userRateLimit } from '../middleware/auth';
import { validateRequest } from '../middleware/errorHandler';

const router = express.Router();

router.get('/', validatePagination, getBattles);
router.get('/:id', validateObjectId('id'), getBattle);
router.post('/', authenticate, validateCreateBattle, validateRequest, createBattle);
router.post('/:id/join', authenticate, validateObjectId('id'), joinBattle);
router.post('/:id/leave', authenticate, validateObjectId('id'), leaveBattle);
router.post('/:id/start', authenticate, validateObjectId('id'), startBattle);
router.post('/:id/submit', authenticate, validateObjectId('id'), submitBattleAnswer);
router.get('/:id/leaderboard', validateObjectId('id'), getBattleLeaderboard);
router.post('/:id/end', authenticate, validateObjectId('id'), endBattle);

export default router;