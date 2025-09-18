import React, { useState } from 'react';
import useSWR from 'swr';
import { tickersApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { PriceTick, Ticker } from '@/types';
import TickerList from '@/components/TickerList';
import TradeModal from '@/components/TradeModal';
import { Plus, TrendingUp, Activity, Search, Filter } from 'lucide-react';

const MarketPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'stocks' | 'crypto'>('all');

  // Fetch tickers data
  const { data: tickersData, error: tickersError, mutate: mutateTickers } = useSWR(
    'tickers',
    () => tickersApi.getTickers(),
    { refreshInterval: 1000 }
  );

  // WebSocket for real-time price updates
  useWebSocket({
    userId: user?.id,
    onPriceUpdate: (ticks: PriceTick[]) => {
      // Update tickers with new prices
      setTickers(prevTickers => {
        const updatedTickers = [...prevTickers];
        ticks.forEach(tick => {
          const tickerIndex = updatedTickers.findIndex(t => t.symbol === tick.symbol);
          if (tickerIndex !== -1) {
            updatedTickers[tickerIndex] = {
              ...updatedTickers[tickerIndex],
              price: tick.price,
              change: tick.change,
              changePercent: tick.changePercent,
            };
          }
        });
        return updatedTickers;
      });
    },
  });

  // Initialize tickers data
  React.useEffect(() => {
    if (tickersData?.data) {
      setTickers(tickersData.data);
    }
  }, [tickersData]);

  const handleTradeClick = (symbol: string) => {
    setSelectedTicker(symbol);
    setIsTradeModalOpen(true);
  };

  const handleTradeComplete = () => {
    setIsTradeModalOpen(false);
    setSelectedTicker(null);
    // Refresh tickers data
    mutateTickers();
  };

  if (tickersError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading market data</p>
      </div>
    );
  }

  // Filter tickers based on search and filter
  const filteredTickers = tickers.filter(ticker => {
    const matchesSearch = ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || 
      (filterType === 'crypto' && (ticker.symbol.includes('BTC') || ticker.symbol.includes('ETH'))) ||
      (filterType === 'stocks' && !(ticker.symbol.includes('BTC') || ticker.symbol.includes('ETH')));
    return matchesSearch && matchesFilter;
  });

  // Calculate market stats
  const marketStats = {
    totalTickers: tickers.length,
    gainers: tickers.filter(t => t.change > 0).length,
    losers: tickers.filter(t => t.change < 0).length,
    totalVolume: tickers.reduce((sum, t) => sum + t.volume, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Activity className="h-8 w-8 mr-3 text-blue-600" />
            Market
          </h1>
          <p className="text-gray-600 mt-1">Real-time prices and trading</p>
        </div>
        <button
          onClick={() => setIsTradeModalOpen(true)}
          className="btn btn-primary flex items-center shadow-lg hover:shadow-xl transition-shadow"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Trade
        </button>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Tickers</p>
              <p className="text-2xl font-bold text-blue-900">{marketStats.totalTickers}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Gainers</p>
              <p className="text-2xl font-bold text-green-900">{marketStats.gainers}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Losers</p>
              <p className="text-2xl font-bold text-red-900">{marketStats.losers}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-red-600 rotate-180" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Volume</p>
              <p className="text-2xl font-bold text-purple-900">{(marketStats.totalVolume / 1000000).toFixed(1)}M</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'stocks' | 'crypto')}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Assets</option>
              <option value="stocks">Stocks</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ticker List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Market Data</h2>
          <p className="text-gray-600 mt-1">Click on any ticker to start trading</p>
        </div>
        <div className="p-6">
          <TickerList 
            tickers={filteredTickers} 
            onTradeClick={handleTradeClick}
            isLoading={!tickersData}
          />
        </div>
      </div>

      {/* Trade Modal */}
      {isTradeModalOpen && (
        <TradeModal
          symbol={selectedTicker}
          onClose={() => {
            setIsTradeModalOpen(false);
            setSelectedTicker(null);
          }}
          onTradeComplete={handleTradeComplete}
        />
      )}
    </div>
  );
};

export default MarketPage;


