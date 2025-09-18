import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env['PORT'] || '3001', 10),
  wsPort: parseInt(process.env['WS_PORT'] || '3002', 10),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  databaseUrl: process.env['DATABASE_URL'] || 'file:./dev.db',
  jwtSecret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
  priceTickInterval: parseInt(process.env['PRICE_TICK_INTERVAL'] || '1000', 10),
  priceNoiseFactor: parseFloat(process.env['PRICE_NOISE_FACTOR'] || '0.001'),
} as const;

export const TICKERS = [
  // US Stocks
  'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
  // Crypto
  'BTC-USD', 'ETH-USD', 'ADA-USD', 'SOL-USD', 'MATIC-USD', 'DOT-USD',
  // Forex
  'EUR-USD', 'GBP-USD', 'USD-JPY', 'AUD-USD', 'USD-CAD', 'USD-CHF',
  // Commodities
  'GOLD', 'SILVER', 'OIL', 'NATURAL-GAS', 'COPPER', 'WHEAT',
  // Indices
  'SPY', 'QQQ', 'IWM', 'VIX'
] as const;

export const SUPPORTED_ORDER_TYPES = ['market', 'limit'] as const;
export const SUPPORTED_ORDER_SIDES = ['buy', 'sell'] as const;
export const SUPPORTED_ORDER_STATUSES = ['open', 'filled', 'cancelled', 'partial'] as const;
