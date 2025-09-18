import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface PortfolioSummaryProps {
  cash: number;
  totalValue: number;
  dailyPnL: number;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  cash,
  totalValue,
  dailyPnL,
}) => {
  const { formatAmount } = useCurrency();
  const isPositive = dailyPnL >= 0;
  const pnlPercent = totalValue > 0 ? (dailyPnL / totalValue) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Cash Balance */}
      <div className="card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <DollarSign className="h-8 w-8 text-primary-600" />
          </div>
          <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Cash Balance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatAmount(cash)}
              </p>
          </div>
        </div>
      </div>

      {/* Total Value */}
      <div className="card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatAmount(totalValue)}
              </p>
          </div>
        </div>
      </div>

      {/* Daily P&L */}
      <div className="card">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {isPositive ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-600" />
            )}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Daily P&L</p>
              <div className="flex items-baseline">
                <p className={`text-2xl font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{formatAmount(dailyPnL)}
                </p>
                <p className={`ml-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  ({isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%)
                </p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSummary;
