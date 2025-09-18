import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Currency } from '@/utils/currency';
import { DollarSign, IndianRupee } from 'lucide-react';

const CurrencyToggle: React.FC = () => {
  const { currency, setCurrency, exchangeRate, isLoading } = useCurrency();

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Currency:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleCurrencyChange('USD')}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            currency === 'USD'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DollarSign className="h-4 w-4 mr-1" />
          USD
        </button>
        <button
          onClick={() => handleCurrencyChange('INR')}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            currency === 'INR'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <IndianRupee className="h-4 w-4 mr-1" />
          INR
        </button>
      </div>
      {exchangeRate && currency === 'INR' && (
        <div className="text-xs text-gray-500">
          1 USD = ₹{exchangeRate.rate.toFixed(2)}
        </div>
      )}
      {isLoading && (
        <div className="text-xs text-gray-500">
          Updating rate...
        </div>
      )}
    </div>
  );
};

export default CurrencyToggle;


