import { Router, Request, Response } from 'express';
import { exchangeRateService } from '@/services/exchangeRateService';
import logger from '@/utils/logger';

const router = Router();

// GET /api/exchange-rate
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const exchangeRate = await exchangeRateService.getExchangeRate();
    
    res.json({
      status: 'success',
      data: exchangeRate,
    });
  } catch (error) {
    logger.error('Error fetching exchange rate:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch exchange rate',
      code: 'EXCHANGE_RATE_ERROR',
    });
  }
});

export default router;


