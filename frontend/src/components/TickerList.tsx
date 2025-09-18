import React from 'react';
import { Ticker } from '@/types';
import { TrendingUp, TrendingDown, ArrowUpRight, BarChart3, DollarSign } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';

interface TickerListProps {
  tickers: Ticker[];
  onTradeClick: (symbol: string) => void;
  isLoading?: boolean;
}

const TickerList: React.FC<TickerListProps> = ({ tickers, onTradeClick, isLoading }) => {
  const { formatAmount } = useCurrency();
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-20 rounded-xl"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tickers.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No tickers available</p>
        <p className="text-gray-400 text-sm mt-2">Check your filters or try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickers.map((ticker) => {
        const isPositive = ticker.change >= 0;
        const isCrypto = ticker.symbol.includes('BTC') || ticker.symbol.includes('ETH');
        const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
        const changeBgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
        const borderColor = isPositive ? 'border-green-200' : 'border-red-200';

        return (
          <div
            key={ticker.symbol}
            className={`group relative bg-white border-2 ${borderColor} rounded-xl p-5 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1`}
            onClick={() => onTradeClick(ticker.symbol)}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-50 to-white opacity-50 rounded-xl"></div>
            
            {/* Content */}
            <div className="relative">
              <div className="flex items-start justify-between">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-3 h-3 rounded-full ${isPositive ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                    <h3 className="text-xl font-bold text-gray-900">{ticker.symbol}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${isCrypto ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isCrypto ? 'CRYPTO' : 'STOCK'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-600">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{ticker.volume.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right Section */}
                <div className="text-right">
                  <div className="flex items-center justify-end mb-2">
                    <DollarSign className="h-5 w-5 text-gray-400 mr-1" />
                    <div className="text-2xl font-bold text-gray-900">
                      {formatAmount(ticker.price)}
                    </div>
                  </div>
                  
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${changeBgColor} ${changeColor}`}>
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {isPositive ? '+' : ''}{ticker.change.toFixed(2)} ({isPositive ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              {/* Action Indicator */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Click to trade
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-20 rounded-xl transition-opacity"></div>
          </div>
        );
      })}
    </div>
  );
};

export default TickerList;
