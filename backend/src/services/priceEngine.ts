import { EventEmitter } from 'events';
import { config, TICKERS } from '@/config';
import { PriceTick } from '@/types';
import prisma from '@/db';
import logger from '@/utils/logger';

interface PriceData {
  symbol: string;
  basePrice: number;
  currentPrice: number;
  trend: number;
  volatility: number;
}

export class PriceEngine extends EventEmitter {
  private prices: Map<string, PriceData> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    super();
    this.initializePrices();
  }

  private async initializePrices(): Promise<void> {
    try {
      // Get the latest price for each ticker from the database
      for (const symbol of TICKERS) {
        const latestPrice = await prisma.price.findFirst({
          where: { symbol },
          orderBy: { ts: 'desc' },
        });

        if (latestPrice) {
          this.prices.set(symbol, {
            symbol,
            basePrice: Number(latestPrice.price),
            currentPrice: Number(latestPrice.price),
            trend: 0,
            volatility: this.getVolatility(symbol),
          });
        } else {
          // Fallback prices if no data in database
          const fallbackPrices: Record<string, number> = {
            'AAPL': 172.32,
            'TSLA': 248.50,
            'MSFT': 378.85,
            'BTC-USD': 43250.00,
            'ETH-USD': 2650.00,
          };

          const price = fallbackPrices[symbol] || 100;
          this.prices.set(symbol, {
            symbol,
            basePrice: price,
            currentPrice: price,
            trend: 0,
            volatility: this.getVolatility(symbol),
          });
        }
      }

      logger.info('Price engine initialized with prices for symbols:', Array.from(this.prices.keys()));
    } catch (error) {
      logger.error('Failed to initialize price engine:', error);
      throw error;
    }
  }

  private getVolatility(symbol: string): number {
    // Different volatility for different asset types
    const volatilityMap: Record<string, number> = {
      'AAPL': 0.02,
      'TSLA': 0.05,
      'MSFT': 0.02,
      'BTC-USD': 0.08,
      'ETH-USD': 0.10,
    };
    return volatilityMap[symbol] || 0.03;
  }

  private generatePriceTick(symbol: string): PriceTick {
    const priceData = this.prices.get(symbol);
    if (!priceData) {
      throw new Error(`No price data for symbol: ${symbol}`);
    }

    // Generate random walk with trend and noise
    const randomWalk = (Math.random() - 0.5) * 2; // -1 to 1
    const trendComponent = priceData.trend * 0.001;
    const noiseComponent = randomWalk * priceData.volatility * config.priceNoiseFactor;
    
    const priceChange = trendComponent + noiseComponent;
    const newPrice = Math.max(0.01, priceData.currentPrice * (1 + priceChange));

    // Update trend (slight bias towards mean reversion)
    priceData.trend = priceData.trend * 0.95 + (Math.random() - 0.5) * 0.1;
    priceData.currentPrice = newPrice;

    const change = newPrice - priceData.basePrice;
    const changePercent = (change / priceData.basePrice) * 100;

    return {
      symbol,
      price: Number(newPrice.toFixed(2)),
      ts: Date.now(),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
    };
  }

  private async savePriceTick(tick: PriceTick): Promise<void> {
    try {
      await prisma.price.create({
        data: {
          symbol: tick.symbol,
          price: tick.price,
          ts: new Date(tick.ts),
        },
      });
    } catch (error) {
      logger.error('Failed to save price tick:', error);
    }
  }

  public start(): void {
    if (this.isRunning) {
      logger.warn('Price engine is already running');
      return;
    }

    this.isRunning = true;
    logger.info(`Starting price engine with ${config.priceTickInterval}ms interval`);

    this.intervalId = setInterval(async () => {
      try {
        const ticks: PriceTick[] = [];

        for (const symbol of TICKERS) {
          const tick = this.generatePriceTick(symbol);
          ticks.push(tick);
          await this.savePriceTick(tick);
        }

        // Emit all ticks at once
        this.emit('priceUpdate', ticks);
      } catch (error) {
        logger.error('Error generating price ticks:', error);
      }
    }, config.priceTickInterval);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Price engine stopped');
  }

  public getCurrentPrice(symbol: string): number | null {
    const priceData = this.prices.get(symbol);
    return priceData ? priceData.currentPrice : null;
  }

  public getCurrentPrices(): Map<string, number> {
    const prices = new Map<string, number>();
    for (const [symbol, data] of this.prices) {
      prices.set(symbol, data.currentPrice);
    }
    return prices;
  }

  public isActive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const priceEngine = new PriceEngine();

