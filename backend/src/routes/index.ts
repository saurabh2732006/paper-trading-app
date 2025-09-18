import { Router } from 'express';
import authRoutes from './auth';
import accountRoutes from './account';
import tickersRoutes from './tickers';
import ordersRoutes from './orders';
import exchangeRateRoutes from './exchangeRate';

const router = Router();

router.use('/auth', authRoutes);
router.use('/account', accountRoutes);
router.use('/tickers', tickersRoutes);
router.use('/orders', ordersRoutes);
router.use('/exchange-rate', exchangeRateRoutes);

export default router;
