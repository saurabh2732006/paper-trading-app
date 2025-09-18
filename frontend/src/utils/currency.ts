export type Currency = 'USD' | 'INR';

export interface ExchangeRate {
  base: string;
  target: string;
  rate: number;
  updatedAt: string;
}

export const formatCurrency = (amount: number, currency: Currency, locale: string = 'en-US'): string => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  return new Intl.NumberFormat(locale, options).format(amount);
};

export const convertCurrency = (amount: number, fromCurrency: Currency, toCurrency: Currency, exchangeRate: number): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === 'USD' && toCurrency === 'INR') {
    return amount * exchangeRate;
  }

  if (fromCurrency === 'INR' && toCurrency === 'USD') {
    return amount / exchangeRate;
  }

  return amount;
};

export const getCurrencySymbol = (currency: Currency): string => {
  return currency === 'USD' ? '$' : '₹';
};

export const getCurrencyLocale = (currency: Currency): string => {
  return currency === 'USD' ? 'en-US' : 'en-IN';
};


