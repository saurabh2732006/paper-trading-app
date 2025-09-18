import { Router, Response } from 'express';
import { AuthenticatedRequest } from '@/middleware/auth';
import { accountService } from '@/services/accountService';
import { paginationSchema } from '@/utils/validation';
import logger from '@/utils/logger';

const router = Router();

// GET /api/account
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const snapshot = await accountService.getAccountSnapshot(req.user.id);
    
    res.json({
      status: 'success',
      data: snapshot,
    });
  } catch (error) {
    logger.error('Get account snapshot error:', error);
    throw error;
  }
});

// GET /api/account/positions
router.get('/positions', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const positions = await accountService.getPositions(req.user.id);
    
    res.json({
      status: 'success',
      data: positions,
    });
  } catch (error) {
    logger.error('Get positions error:', error);
    throw error;
  }
});

// GET /api/account/history
router.get('/history', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { page, limit } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;

    const history = await accountService.getTransactionHistory(req.user.id, limit, offset);
    
    res.json({
      status: 'success',
      data: history,
      pagination: {
        page,
        limit,
        total: history.length,
      },
    });
  } catch (error) {
    logger.error('Get transaction history error:', error);
    throw error;
  }
});

export default router;

