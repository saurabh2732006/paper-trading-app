import { describe, it, expect } from 'vitest';
import { formatCurrency, convertCurrency, getCurrencySymbol, getCurrencyLocale } from '../currency';

describe('Currency Utils', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toBe('$1,234.56');
    });

    it('should format INR currency correctly', () => {
      const result = formatCurrency(1234.56, 'INR');
      expect(result).toBe('₹1,234.56');
    });

    it('should use custom locale for formatting', () => {
      const result = formatCurrency(1234.56, 'INR', 'en-IN');
      expect(result).toContain('₹');
    });
  });

  describe('convertCurrency', () => {
    it('should return same amount for same currency', () => {
      const result = convertCurrency(100, 'USD', 'USD', 83.25);
      expect(result).toBe(100);
    });

    it('should convert USD to INR correctly', () => {
      const result = convertCurrency(100, 'USD', 'INR', 83.25);
      expect(result).toBe(8325);
    });

    it('should convert INR to USD correctly', () => {
      const result = convertCurrency(8325, 'INR', 'USD', 83.25);
      expect(result).toBe(100);
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    it('should return correct symbol for INR', () => {
      expect(getCurrencySymbol('INR')).toBe('₹');
    });
  });

  describe('getCurrencyLocale', () => {
    it('should return correct locale for USD', () => {
      expect(getCurrencyLocale('USD')).toBe('en-US');
    });

    it('should return correct locale for INR', () => {
      expect(getCurrencyLocale('INR')).toBe('en-IN');
    });
  });
});


