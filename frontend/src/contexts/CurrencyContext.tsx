import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency, ExchangeRate } from '@/utils/currency';
import { exchangeRateApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: ExchangeRate | null;
  isLoading: boolean;
  convertAmount: (amount: number) => number;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchExchangeRate = async () => {
    try {
      setIsLoading(true);
      const response = await exchangeRateApi.getExchangeRate();
      
      if (response.status === 'success' && response.data) {
        setExchangeRate(response.data);
      } else {
        throw new Error('Failed to fetch exchange rate');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast.error('Failed to fetch exchange rate');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
    
    // Refresh exchange rate every 10 minutes
    const interval = setInterval(fetchExchangeRate, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const convertAmount = (amount: number): number => {
    if (!exchangeRate || currency === 'USD') {
      return amount;
    }
    
    return amount * exchangeRate.rate;
  };

  const formatAmount = (amount: number): string => {
    const convertedAmount = convertAmount(amount);
    const locale = currency === 'USD' ? 'en-US' : 'en-IN';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedAmount);
  };

  const value: CurrencyContextType = {
    currency,
    setCurrency,
    exchangeRate,
    isLoading,
    convertAmount,
    formatAmount,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};


