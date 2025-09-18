import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  unrealizedPnL: number;
}

interface TopHoldingsProps {
  positions: Position[];
}

const TopHoldings: React.FC<TopHoldingsProps> = ({ positions }) => {
  // Sort by value and take top 3
  const topHoldings = positions
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  if (topHoldings.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No positions yet</p>
        <p className="text-sm">Start trading to see your holdings here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topHoldings.map((position) => {
        const isPositive = position.unrealizedPnL >= 0;
        const pnlPercent = position.avgPrice > 0 
          ? (position.unrealizedPnL / (position.avgPrice * position.qty)) * 100 
          : 0;

        return (
          <div key={position.symbol} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{position.symbol}</h3>
                <span className="text-sm text-gray-500">
                  {position.qty} shares
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-sm text-gray-600">
                  <span>Avg: ${position.avgPrice.toFixed(2)}</span>
                  <span className="mx-2">•</span>
                  <span>Current: ${position.currentPrice.toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${position.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className={`text-sm flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {isPositive ? '+' : ''}${position.unrealizedPnL.toFixed(2)} ({isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopHoldings;


