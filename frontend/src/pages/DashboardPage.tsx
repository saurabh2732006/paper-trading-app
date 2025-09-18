import React from 'react';
import useSWR from 'swr';
import { accountApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { PriceTick } from '@/types';
import PortfolioSummary from '@/components/PortfolioSummary';
import PriceChart from '@/components/PriceChart';
import TopHoldings from '@/components/TopHoldings';
import RecentOrders from '@/components/RecentOrders';
import { TrendingUp, TrendingDown, Activity, DollarSign, PieChart, BarChart3 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [priceData, setPriceData] = React.useState<PriceTick[]>([]);

  // Fetch account data
  const { data: accountData, error: accountError, mutate: mutateAccount, isLoading: accountLoading } = useSWR(
    'account-snapshot',
    () => accountApi.getSnapshot(),
    { refreshInterval: 5000 }
  );

  // Fetch recent orders
  const { data: ordersData, error: ordersError, isLoading: ordersLoading } = useSWR(
    'recent-orders',
    () => accountApi.getHistory(1, 10),
    { refreshInterval: 10000 }
  );

  // WebSocket for real-time price updates
  useWebSocket({
    userId: user?.id,
    onPriceUpdate: (ticks: PriceTick[]) => {
      setPriceData(ticks);
      // Trigger account data refresh when prices update
      mutateAccount();
    },
  });

  if (accountError || ordersError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Activity className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There was an error loading your trading data. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const account = accountData?.data;
  const recentOrders = ordersData?.data || [];

  // Calculate performance metrics
  const totalReturn = account ? account.totalValue - 100000 : 0;
  const totalReturnPercent = account ? ((account.totalValue - 100000) / 100000) * 100 : 0;
  const isPositive = totalReturn >= 0;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.username}! 🚀
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's your trading performance overview
          </p>
        </div>
        
        {/* Quick Stats Cards */}
        <div className="mt-4 lg:mt-0 flex space-x-4">
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <Activity className="h-5 w-5 text-primary-600 mr-2" />
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Live Updates</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Real-time</p>
            </div>
          </div>
          
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-sm">
            <DollarSign className="h-5 w-5 text-success-600 mr-2" />
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Starting Capital</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">$100,000</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Overview Cards */}
      {account && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Portfolio Value */}
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm font-medium">Portfolio Value</p>
                <p className="text-2xl font-bold">
                  ${account.totalValue.toLocaleString()}
                </p>
              </div>
              <PieChart className="h-8 w-8 text-primary-200" />
            </div>
            <div className="mt-4 flex items-center">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-primary-200 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-primary-200 mr-1" />
              )}
              <span className="text-sm text-primary-100">
                {isPositive ? '+' : ''}{totalReturnPercent.toFixed(2)}% overall
              </span>
            </div>
          </div>

          {/* Available Cash */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Available Cash</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${account.cash.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-success-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Buying Power</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  ${account.cash.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Daily P&L */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Today's P&L</p>
                <p className={`text-2xl font-bold ${
                  account.dailyPnL >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {account.dailyPnL >= 0 ? '+' : ''}${account.dailyPnL.toLocaleString()}
                </p>
              </div>
              {account.dailyPnL >= 0 ? (
                <TrendingUp className="h-8 w-8 text-success-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-danger-500" />
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  account.dailyPnL >= 0 
                    ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                    : 'bg-danger-100 text-danger-800 dark:bg-danger-900 dark:text-danger-200'
                }`}>
                  {account.dailyPnL >= 0 ? 'Profit' : 'Loss'}
                </div>
              </div>
            </div>
          </div>

          {/* Total Return */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Return</p>
                <p className={`text-2xl font-bold ${
                  totalReturn >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {totalReturn >= 0 ? '+' : ''}${totalReturn.toLocaleString()}
                </p>
              </div>
              <BarChart3 className={`h-8 w-8 ${
                totalReturn >= 0 ? 'text-success-500' : 'text-danger-500'
              }`} />
            </div>
            <div className="mt-4">
              <div className="flex items-center">
                <span className={`text-sm font-medium ${
                  totalReturn >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturnPercent.toFixed(2)}%
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">since start</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Summary Component */}
      {account && !accountLoading && (
        <PortfolioSummary
          cash={account.cash}
          totalValue={account.totalValue}
          dailyPnL={account.dailyPnL}
        />
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Market Overview - Takes 2 columns */}
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Market Overview
                </h2>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-success-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Live</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time price movements across all markets
              </p>
            </div>
            <div className="p-6">
              <PriceChart data={priceData} />
            </div>
          </div>
        </div>

        {/* Top Holdings */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Holdings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your largest positions
              </p>
            </div>
            <div className="p-6">
              {accountLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <TopHoldings positions={account?.positions || []} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Trading Activity
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your latest orders and transactions
              </p>
            </div>
            <button className="btn btn-secondary text-sm">
              View All Orders
            </button>
          </div>
        </div>
        <div className="p-6">
          {ordersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <RecentOrders orders={recentOrders} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


