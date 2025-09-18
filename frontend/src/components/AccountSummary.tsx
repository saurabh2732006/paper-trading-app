import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  unrealizedPnL: number;
}

interface AccountSummaryProps {
  cash: number;
  totalValue: number;
  dailyPnL: number;
  positions: Position[];
}

const AccountSummary: React.FC<AccountSummaryProps> = ({
  cash,
  totalValue,
  dailyPnL,
  positions,
}) => {
  const isPositive = dailyPnL >= 0;
  const pnlPercent = totalValue > 0 ? (dailyPnL / totalValue) * 100 : 0;
  const totalInvested = positions.reduce((sum, pos) => sum + (pos.qty * pos.avgPrice), 0);
  const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Cash Balance</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PieChart className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

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
                  {isPositive ? '+' : ''}${dailyPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className={`ml-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  ({isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%)
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Unrealized P&L</p>
              <div className="flex items-baseline">
                <p className={`text-2xl font-semibold ${totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cash</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(cash / totalValue) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {((cash / totalValue) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            {positions.map((position) => {
              const percentage = (position.value / totalValue) * 100;
              return (
                <div key={position.symbol} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{position.symbol}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Invested:</span>
              <span className="text-sm font-medium text-gray-900">
                ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Current Value:</span>
              <span className="text-sm font-medium text-gray-900">
                ${(totalInvested + totalUnrealizedPnL).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Return:</span>
              <span className={`text-sm font-medium ${totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalUnrealizedPnL >= 0 ? '+' : ''}${totalUnrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Return %:</span>
              <span className={`text-sm font-medium ${totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalInvested > 0 ? (
                  <>
                    {totalUnrealizedPnL >= 0 ? '+' : ''}{((totalUnrealizedPnL / totalInvested) * 100).toFixed(2)}%
                  </>
                ) : (
                  '0.00%'
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSummary;


