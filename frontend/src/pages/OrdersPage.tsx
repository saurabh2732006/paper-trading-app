import React, { useState } from 'react';
import useSWR from 'swr';
import { ordersApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { OrderUpdate } from '@/types';
import OrdersList from '@/components/OrdersList';
import { RefreshCw, FileText, Filter, BarChart3, Clock } from 'lucide-react';

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch orders data
  const { data: ordersData, error: ordersError, mutate: mutateOrders } = useSWR(
    `orders-${statusFilter}`,
    () => ordersApi.getOrders(statusFilter || undefined),
    { refreshInterval: 5000 }
  );

  // WebSocket for real-time order updates
  useWebSocket({
    userId: user?.id,
    onOrderUpdate: (_update: OrderUpdate) => {
      // Refresh orders when we receive an update
      mutateOrders();
    },
  });

  const handleRefresh = () => {
    mutateOrders();
  };

  if (ordersError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading orders</p>
      </div>
    );
  }

  const orders = ordersData?.data || [];

  // Calculate order statistics
  const orderStats = {
    total: orders.length,
    open: orders.filter(o => o.status === 'open').length,
    filled: orders.filter(o => o.status === 'filled').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="h-8 w-8 mr-3 text-blue-600" />
            Orders
          </h1>
          <p className="text-gray-600 mt-1">Manage and track your trading orders</p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-secondary flex items-center shadow-md hover:shadow-lg transition-shadow"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Order Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-blue-900">{orderStats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Open Orders</p>
              <p className="text-2xl font-bold text-orange-900">{orderStats.open}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Filled Orders</p>
              <p className="text-2xl font-bold text-green-900">{orderStats.filled}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Cancelled</p>
              <p className="text-2xl font-bold text-red-900">{orderStats.cancelled}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <label className="text-sm font-semibold text-gray-700">Filter by status:</label>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Orders</option>
            <option value="open">Open Orders</option>
            <option value="filled">Filled Orders</option>
            <option value="cancelled">Cancelled Orders</option>
            <option value="partial">Partial Orders</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {statusFilter 
              ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Orders` 
              : 'All Orders'
            }
          </h2>
          <p className="text-gray-600 mt-1">
            {orders.length === 0 
              ? 'No orders found' 
              : `Showing ${orders.length} order${orders.length !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div className="p-6">
          <OrdersList orders={orders} onOrderUpdate={mutateOrders} />
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;


