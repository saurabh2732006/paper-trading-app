import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { config } from '@/config';
import { errorHandler } from '@/utils/errors';
import { authenticate } from '@/middleware/auth';
import authRoutes from '@/routes/auth';
import accountRoutes from '@/routes/account';
import tickersRoutes from '@/routes/tickers';
import ordersRoutes from '@/routes/orders';
import exchangeRateRoutes from '@/routes/exchangeRate';
import { WebSocketManager } from '@/websocket/server';
import { priceEngine } from '@/services/priceEngine';
import logger from '@/utils/logger';

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
	origin: (origin, callback) => {
		// Allow requests with no origin like mobile apps or curl
		if (!origin) return callback(null, true);
    const allowed = [
      process.env['FRONTEND_URL'] || '',
    ].filter(Boolean);
    // Allow any localhost or 127.0.0.1 origin (useful for Vite dev servers on different ports)
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    if (allowed.some((o) => origin.startsWith(o))) {
      return callback(null, true);
    }
		return callback(new Error('Not allowed by CORS'));
	},
	credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/account', authenticate, accountRoutes);
app.use('/api/tickers', tickersRoutes);
app.use('/api/orders', authenticate, ordersRoutes);
app.use('/api/exchange-rate', exchangeRateRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    code: 'NOT_FOUND',
  });
});

// Initialize WebSocket server
new WebSocketManager(server);

// Start price engine
priceEngine.start();

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  priceEngine.stop();
  server.close(() => {
    logger.info('Server closed successfully');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start server with error handling
const PORT = config.port;
const startServer = (port: number, retries = 3): void => {
  const serverInstance = server.listen(port, () => {
    logger.info(`✅ Server running on port ${port}`);
    logger.info(`🔌 WebSocket server running on /ws/prices`);
    logger.info(`📈 Price engine started with ${config.priceTickInterval}ms interval`);
  });

  serverInstance.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${port} is already in use`);
      
      if (retries > 0) {
        const newPort = port + 1;
        logger.info(`🔄 Retrying with port ${newPort} (${retries} retries left)`);
        setTimeout(() => startServer(newPort, retries - 1), 1000);
      } else {
        logger.error('❌ No more retries left. Please free up the port or change the PORT environment variable.');
        logger.error('💡 You can kill the process using the port with: npx kill-port 3001');
        process.exit(1);
      }
    } else if (error.code === 'EACCES') {
      logger.error(`❌ Permission denied for port ${port}. Try using a port above 1024.`);
      process.exit(1);
    } else {
      logger.error('❌ Server error:', error);
      process.exit(1);
    }
  });
};

// Initialize server
try {
  startServer(PORT);
} catch (error) {
  logger.error('❌ Failed to start server:', error);
  process.exit(1);
}

export default app;
