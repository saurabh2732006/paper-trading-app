import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MatchingEngine } from '../matchingEngine';
import { CreateOrderRequest } from '@/types';

// Mock the database
const mockPrisma = {
  order: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
  },
  position: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/db', () => ({
  default: mockPrisma,
}));

// Mock price engine
const mockPriceEngine = {
  getCurrentPrice: vi.fn(),
  on: vi.fn(),
};

vi.mock('../priceEngine', () => ({
  priceEngine: mockPriceEngine,
}));

describe('MatchingEngine', () => {
  let matchingEngine: MatchingEngine;

  beforeEach(() => {
    matchingEngine = new MatchingEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create a market buy order', async () => {
      const userId = 1;
      const orderData: CreateOrderRequest = {
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        qty: 10,
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        startingCash: 100000,
      });

      mockPriceEngine.getCurrentPrice.mockReturnValue(150.00);

      mockPrisma.order.create.mockResolvedValue({
        id: 1,
        userId,
        ...orderData,
        status: 'open',
        filledQty: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await matchingEngine.createOrder(userId, orderData);

      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.side).toBe('buy');
      expect(result.type).toBe('market');
      expect(result.qty).toBe(10);
      expect(result.status).toBe('open');
    });

    it('should reject order with insufficient funds', async () => {
      const userId = 1;
      const orderData: CreateOrderRequest = {
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        qty: 1000, // Large quantity
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        startingCash: 1000, // Low cash
      });

      mockPriceEngine.getCurrentPrice.mockReturnValue(150.00);

      await expect(matchingEngine.createOrder(userId, orderData))
        .rejects.toThrow('Insufficient funds');
    });

    it('should reject sell order with insufficient position', async () => {
      const userId = 1;
      const orderData: CreateOrderRequest = {
        symbol: 'AAPL',
        side: 'sell',
        type: 'market',
        qty: 100,
      };

      mockPrisma.position.findUnique.mockResolvedValue({
        id: 1,
        userId,
        symbol: 'AAPL',
        qty: 50, // Less than order quantity
        avgPrice: 150.00,
      });

      await expect(matchingEngine.createOrder(userId, orderData))
        .rejects.toThrow('Insufficient position');
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an open order', async () => {
      const userId = 1;
      const orderId = 1;

      mockPrisma.order.findFirst.mockResolvedValue({
        id: orderId,
        userId,
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        qty: 10,
        status: 'open',
        filledQty: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockPrisma.order.update.mockResolvedValue({
        id: orderId,
        userId,
        symbol: 'AAPL',
        side: 'buy',
        type: 'market',
        qty: 10,
        status: 'cancelled',
        filledQty: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await matchingEngine.cancelOrder(userId, orderId);

      expect(result).toBeDefined();
      expect(result.status).toBe('cancelled');
      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error for non-existent order', async () => {
      const userId = 1;
      const orderId = 999;

      mockPrisma.order.findFirst.mockResolvedValue(null);

      await expect(matchingEngine.cancelOrder(userId, orderId))
        .rejects.toThrow('Order 999 not found');
    });
  });
});


