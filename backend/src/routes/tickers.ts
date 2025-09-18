import { Router, Request, Response } from 'express';
import { priceEngine } from '@/services/priceEngine';
import { TICKERS } from '@/config';
import { dateRangeSchema } from '@/utils/validation';
import prisma from '@/db';
import logger from '@/utils/logger';

const router = Router();

// GET /api/tickers
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const currentPrices = priceEngine.getCurrentPrices();
    const tickers = TICKERS.map((symbol) => {
      const price = currentPrices.get(symbol) || 0;
      return {
        symbol,
        price,
        change: 0, // Will be calculated in real implementation
        changePercent: 0,
        volume: Math.floor(Math.random() * 1000000), // Mock volume
      };
    });

    res.json({
      status: 'success',
      data: tickers,
    });
  } catch (error) {
    logger.error('Get tickers error:', error);
    throw error;
  }
});

// GET /api/tickers/:symbol/history
router.get('/:symbol/history', async (req, res: Response): Promise<void> => {
  try {
    const { symbol } = req.params;
    const { from, to } = dateRangeSchema.parse(req.query);

    if (!TICKERS.includes(symbol as any)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid symbol',
        code: 'INVALID_SYMBOL',
      });
      return;
    }

    const where: any = { symbol };
    
    if (from) {
      where.ts = { ...where.ts, gte: from };
    }
    
    if (to) {
      where.ts = { ...where.ts, lte: to };
    }

    const prices = await prisma.price.findMany({
      where,
      orderBy: { ts: 'asc' },
      take: 1000, // Limit to prevent large responses
    });

    const history = prices.map((price) => ({
      symbol: price.symbol,
      ts: price.ts.toISOString(),
      price: Number(price.price),
    }));

    res.json({
      status: 'success',
      data: history,
    });
  } catch (error) {
    logger.error('Get price history error:', error);
    throw error;
  }
});

export default router;

