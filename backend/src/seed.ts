import { PrismaClient } from '@prisma/client';
import { TICKERS } from '@/config';
import logger from '@/utils/logger';

const prisma = new PrismaClient();

// Sample price data for seeding
const generatePriceData = (symbol: string, days = 7): Array<{ symbol: string; ts: Date; price: number }> => {
  const prices: Array<{ symbol: string; ts: Date; price: number }> = [];
  
  // Base prices for each symbol
  const basePrices: Record<string, number> = {
    // US Stocks
    'AAPL': 172.32, 'TSLA': 248.50, 'MSFT': 378.85, 'GOOGL': 142.50, 'AMZN': 155.20,
    'META': 325.40, 'NVDA': 485.30, 'NFLX': 425.80, 'AMD': 125.60, 'INTC': 45.20,
    // Crypto
    'BTC-USD': 43250.00, 'ETH-USD': 2650.00, 'ADA-USD': 0.45, 'SOL-USD': 95.20,
    'MATIC-USD': 0.85, 'DOT-USD': 6.80,
    // Forex
    'EUR-USD': 1.0850, 'GBP-USD': 1.2650, 'USD-JPY': 149.20, 'AUD-USD': 0.6580,
    'USD-CAD': 1.3650, 'USD-CHF': 0.8750,
    // Commodities
    'GOLD': 2045.50, 'SILVER': 24.80, 'OIL': 78.20, 'NATURAL-GAS': 2.85,
    'COPPER': 3.95, 'WHEAT': 6.20,
    // Indices
    'SPY': 445.50, 'QQQ': 385.20, 'IWM': 195.80, 'VIX': 18.50,
  };

  const basePrice = basePrices[symbol] || 100;
  
  // Different volatility for different asset types
  let volatility = 0.02; // Default for stocks
  if (symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('ADA') || 
      symbol.includes('SOL') || symbol.includes('MATIC') || symbol.includes('DOT')) {
    volatility = 0.05; // High volatility for crypto
  } else if (symbol.includes('EUR') || symbol.includes('GBP') || symbol.includes('JPY') || 
             symbol.includes('AUD') || symbol.includes('CAD') || symbol.includes('CHF')) {
    volatility = 0.01; // Low volatility for forex
  } else if (symbol.includes('GOLD') || symbol.includes('SILVER') || symbol.includes('OIL') || 
             symbol.includes('NATURAL-GAS') || symbol.includes('COPPER') || symbol.includes('WHEAT')) {
    volatility = 0.03; // Medium volatility for commodities
  } else if (symbol.includes('SPY') || symbol.includes('QQQ') || symbol.includes('IWM')) {
    volatility = 0.015; // Low volatility for indices
  } else if (symbol.includes('VIX')) {
    volatility = 0.08; // Very high volatility for VIX
  }
  
  let currentPrice = basePrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(9, 30, 0, 0); // Start at market open

  // Generate minute-by-minute data for the specified days
  for (let day = 0; day < days; day++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(startDate.getDate() + day);
    
    // Market hours: 9:30 AM to 4:00 PM (6.5 hours = 390 minutes)
    for (let minute = 0; minute < 390; minute++) {
      const ts = new Date(currentDay);
      ts.setMinutes(currentDay.getMinutes() + minute);
      
      // Skip weekends
      if (ts.getDay() === 0 || ts.getDay() === 6) {
        continue;
      }

      // Generate price with random walk
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      currentPrice = Math.max(0.01, currentPrice * (1 + randomChange));
      
      prices.push({
        symbol,
        ts,
        price: Number(currentPrice.toFixed(2)),
      });
    }
  }

  return prices;
};

async function seed(): Promise<void> {
  try {
    logger.info('Starting database seed...');

    // Clear existing data
    await prisma.price.deleteMany();
    await prisma.order.deleteMany();
    await prisma.position.deleteMany();
    await prisma.user.deleteMany();

    logger.info('Cleared existing data');

    // Create sample users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          username: 'demo_user',
          startingCash: 100000,
        },
      }),
      prisma.user.create({
        data: {
          username: 'test_user',
          startingCash: 50000,
        },
      }),
    ]);

    logger.info(`Created ${users.length} users`);

    // Generate and insert price data for each ticker
    for (const symbol of TICKERS) {
      logger.info(`Generating price data for ${symbol}...`);
      const priceData = generatePriceData(symbol, 7);
      
      await prisma.price.createMany({
        data: priceData,
      });
      
      logger.info(`Inserted ${priceData.length} price records for ${symbol}`);
    }

    // Create some sample orders for demo user
    const demoUser = users[0];
    await prisma.order.createMany({
      data: [
        {
          userId: demoUser.id,
          symbol: 'AAPL',
          side: 'buy',
          type: 'market',
          qty: 10,
          status: 'filled',
          filledQty: 10,
          avgPrice: 172.50,
        },
        {
          userId: demoUser.id,
          symbol: 'TSLA',
          side: 'buy',
          type: 'limit',
          qty: 5,
          price: 250.00,
          status: 'open',
          filledQty: 0,
        },
      ],
    });

    // Create sample positions
    await prisma.position.createMany({
      data: [
        {
          userId: demoUser.id,
          symbol: 'AAPL',
          qty: 10,
          avgPrice: 172.50,
        },
      ],
    });

    logger.info('Database seed completed successfully');
  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      logger.info('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

export default seed;
