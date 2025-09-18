import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PriceEngine } from '../priceEngine';
import { config } from '@/config';

// Mock the database
vi.mock('@/db', () => ({
  default: {
    price: {
      findFirst: vi.fn().mockResolvedValue({
        symbol: 'AAPL',
        price: 172.32,
      }),
    },
  },
}));

describe('PriceEngine', () => {
  let priceEngine: PriceEngine;

  beforeEach(() => {
    priceEngine = new PriceEngine();
    vi.useFakeTimers();
  });

  afterEach(() => {
    priceEngine.stop();
    vi.useRealTimers();
  });

  it('should initialize with default prices', async () => {
    await priceEngine.initializePrices();
    
    const aaplPrice = priceEngine.getCurrentPrice('AAPL');
    expect(aaplPrice).toBe(172.32);
  });

  it('should generate price ticks', async () => {
    await priceEngine.initializePrices();
    
    const mockCallback = vi.fn();
    priceEngine.on('priceUpdate', mockCallback);

    priceEngine.start();
    
    // Fast-forward time to trigger price generation
    vi.advanceTimersByTime(config.priceTickInterval);
    
    expect(mockCallback).toHaveBeenCalled();
    
    const callArgs = mockCallback.mock.calls[0][0];
    expect(Array.isArray(callArgs)).toBe(true);
    expect(callArgs.length).toBeGreaterThan(0);
    
    const tick = callArgs[0];
    expect(tick).toHaveProperty('symbol');
    expect(tick).toHaveProperty('price');
    expect(tick).toHaveProperty('ts');
    expect(tick).toHaveProperty('change');
    expect(tick).toHaveProperty('changePercent');
  });

  it('should stop generating ticks when stopped', async () => {
    await priceEngine.initializePrices();
    
    const mockCallback = vi.fn();
    priceEngine.on('priceUpdate', mockCallback);

    priceEngine.start();
    priceEngine.stop();
    
    vi.advanceTimersByTime(config.priceTickInterval * 2);
    
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should return null for unknown symbol', () => {
    const price = priceEngine.getCurrentPrice('UNKNOWN');
    expect(price).toBeNull();
  });
});


