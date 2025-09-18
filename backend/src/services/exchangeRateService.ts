import axios from 'axios';
import logger from '@/utils/logger';

interface ExchangeRate {
  base: string;
  target: string;
  rate: number;
  updatedAt: string;
}

class ExchangeRateService {
  private cache: ExchangeRate | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private readonly API_URL = 'https://api.exchangerate.host/latest';

  public async getExchangeRate(): Promise<ExchangeRate> {
    const now = Date.now();
    
    // Return cached rate if still valid
    if (this.cache && now < this.cacheExpiry) {
      logger.debug('Returning cached exchange rate');
      return this.cache;
    }

    try {
      logger.info('Fetching fresh exchange rate from API');
      const response = await axios.get(this.API_URL, {
        params: {
          base: 'USD',
          symbols: 'INR',
        },
        timeout: 5000,
      });

      if (response.data.success && response.data.rates?.INR) {
        const rate = response.data.rates.INR;
        
        this.cache = {
          base: 'USD',
          target: 'INR',
          rate,
          updatedAt: new Date().toISOString(),
        };
        
        this.cacheExpiry = now + this.CACHE_DURATION;
        
        logger.info(`Exchange rate updated: 1 USD = ${rate} INR`);
        return this.cache;
      } else {
        throw new Error('Invalid response from exchange rate API');
      }
    } catch (error) {
      logger.error('Failed to fetch exchange rate:', error);
      
      // Return cached rate if available, even if expired
      if (this.cache) {
        logger.warn('Using expired cached exchange rate due to API error');
        return this.cache;
      }
      
      // Fallback rate if no cache available
      const fallbackRate = 83.25; // Approximate USD to INR rate
      logger.warn(`Using fallback exchange rate: ${fallbackRate}`);
      
      this.cache = {
        base: 'USD',
        target: 'INR',
        rate: fallbackRate,
        updatedAt: new Date().toISOString(),
      };
      
      return this.cache;
    }
  }

  public getCachedRate(): ExchangeRate | null {
    return this.cache;
  }

  public isCacheValid(): boolean {
    return this.cache !== null && Date.now() < this.cacheExpiry;
  }
}

export const exchangeRateService = new ExchangeRateService();


