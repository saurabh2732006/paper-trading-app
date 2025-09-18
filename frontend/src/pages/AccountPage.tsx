import React, { useState } from 'react';
import useSWR from 'swr';
import { accountApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
// ...existing types are imported where needed in components
import AccountSummary from '@/components/AccountSummary';
import PositionsTable from '@/components/PositionsTable';
import TransactionHistory from '@/components/TransactionHistory';
import { RefreshCw, RotateCcw, User, AlertTriangle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const AccountPage: React.FC = () => {
  const { user, resetAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'history'>('overview');
  const [isResetting, setIsResetting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch account data
  const { data: accountData, error: accountError, mutate: mutateAccount } = useSWR(
    'account-snapshot',
    () => accountApi.getSnapshot(),
    { refreshInterval: 10000 }
  );

  // Fetch positions data
  const { data: positionsData, error: positionsError, mutate: mutatePositions } = useSWR(
    'positions',
    () => accountApi.getPositions(),
    { refreshInterval: 10000 }
  );

  // Fetch transaction history
  const { data: historyData, error: historyError, mutate: mutateHistory } = useSWR(
    'transaction-history',
    () => accountApi.getHistory(1, 50),
    { refreshInterval: 30000 }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        mutateAccount(),
        mutatePositions(), 
        mutateHistory()
      ]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetAccount = async () => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to reset your account? This will delete all orders and positions.')) {
      setIsResetting(true);
      try {
        await resetAccount();
        toast.success('Account reset successfully');
        // Refresh all data after reset
        await handleRefresh();
      } catch (error) {
        toast.error('Failed to reset account');
      } finally {
        setIsResetting(false);
      }
    }
  };

  // Loading state
  const isLoading = !accountData && !accountError;
  const hasError = accountError || positionsError || historyError;

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Account</h2>
          <p className="text-gray-600 mb-6">We encountered an issue while loading your account data.</p>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-primary flex items-center mx-auto"
          >
            {isRefreshing ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const account = accountData?.data;
  const positions = positionsData?.data || [];
  const history = historyData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <User className="h-8 w-8 mr-3 text-blue-600" />
            Account
          </h1>
          <p className="text-gray-600 mt-1">Manage your account and view detailed information</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary flex items-center shadow-md hover:shadow-lg transition-shadow"
          >
            {isRefreshing ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={handleResetAccount}
            disabled={isResetting}
            className="btn btn-danger flex items-center shadow-md hover:shadow-lg transition-shadow"
          >
            {isResetting ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            {isResetting ? 'Resetting...' : 'Reset Account'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <nav className="flex space-x-8 p-6 border-b border-gray-200">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'positions', name: 'Positions' },
            { id: 'history', name: 'Transaction History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative py-2 px-4 font-semibold text-sm rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.name}
              {activeTab === tab.id && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Loading account data...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && account && (
                <AccountSummary
                  cash={account.cash}
                  totalValue={account.totalValue}
                  dailyPnL={account.dailyPnL}
                  positions={account.positions}
                />
              )}

              {activeTab === 'positions' && (
                <PositionsTable positions={positions} />
              )}

              {activeTab === 'history' && (
                <TransactionHistory orders={history} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountPage;


