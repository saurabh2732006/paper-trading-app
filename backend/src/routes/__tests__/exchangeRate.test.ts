import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import exchangeRateRoutes from '../exchangeRate';

const app = express();
app.use(express.json());
app.use('/api/exchange-rate', exchangeRateRoutes);

// Mock the exchange rate service
vi.mock('@/services/exchangeRateService', () => ({
  exchangeRateService: {
    getExchangeRate: vi.fn(),
  },
}));

import { exchangeRateService } from '@/services/exchangeRateService';

describe('Exchange Rate API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return exchange rate successfully', async () => {
    const mockRate = {
      base: 'USD',
      target: 'INR',
      rate: 83.25,
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    vi.mocked(exchangeRateService.getExchangeRate).mockResolvedValue(mockRate);

    const response = await request(app)
      .get('/api/exchange-rate')
      .expect(200);

    expect(response.body).toEqual({
      status: 'success',
      data: mockRate,
    });
  });

  it('should handle exchange rate service errors', async () => {
    vi.mocked(exchangeRateService.getExchangeRate).mockRejectedValue(
      new Error('API Error')
    );

    const response = await request(app)
      .get('/api/exchange-rate')
      .expect(500);

    expect(response.body).toEqual({
      status: 'error',
      message: 'Failed to fetch exchange rate',
      code: 'EXCHANGE_RATE_ERROR',
    });
  });
});


