import React, { useState } from 'react';
import { Order } from '@/types';
import { ordersApi } from '@/lib/api';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

interface OrdersListProps {
  orders: Order[];
  onOrderUpdate: () => void;
}

const OrdersList: React.FC<OrdersListProps> = ({ orders, onOrderUpdate }) => {
  const [cancellingOrders, setCancellingOrders] = useState<Set<number>>(new Set());

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'open':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return 'text-green-600 bg-green-100';
      case 'open':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'partial':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      setCancellingOrders(prev => new Set(prev).add(orderId));
      
      const response = await ordersApi.cancelOrder(orderId);
      
      if (response.status === 'success') {
        toast.success('Order cancelled successfully');
        onOrderUpdate();
      } else {
        throw new Error(response.message || 'Failed to cancel order');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to cancel order';
      toast.error(message);
    } finally {
      setCancellingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const canCancelOrder = (order: Order) => {
    return order.status === 'open' || order.status === 'partial';
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Activity className="h-10 w-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Your trading orders will appear here. Start trading to see your order history and manage active orders.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const isCancelling = cancellingOrders.has(order.id);
        const canCancel = canCancelOrder(order);
        const isBuyOrder = order.side === 'buy';
        const statusColor = getStatusColor(order.status);

        return (
          <div 
            key={order.id} 
            className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200"
          >
            {/* Status indicator line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
              order.status === 'filled' ? 'bg-green-500' :
              order.status === 'open' ? 'bg-orange-500' :
              order.status === 'cancelled' ? 'bg-red-500' :
              order.status === 'partial' ? 'bg-blue-500' : 'bg-gray-400'
            }`}></div>

            <div className="flex items-start justify-between">
              {/* Left Section */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon(order.status)}
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                      isBuyOrder ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {isBuyOrder ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {order.side.toUpperCase()}
                    </span>
                    <span className="text-xl font-bold text-gray-900">{order.symbol}</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Target className="h-4 w-4 mr-1" />
                    <span className="font-medium">Qty:</span>
                    <span className="ml-1 font-bold text-gray-900">{order.qty}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="font-medium">Type:</span>
                    <span className="ml-1 font-bold text-gray-900">{order.type.toUpperCase()}</span>
                  </div>
                  {order.price && (
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="font-medium">Price:</span>
                      <span className="ml-1 font-bold text-gray-900">${order.price.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="font-medium">{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                {order.filledQty > 0 && (
                  <div className="mt-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-600">Fill Progress</span>
                      <span className="font-semibold text-blue-600">
                        {order.filledQty}/{order.qty} ({((order.filledQty / order.qty) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(order.filledQty / order.qty) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {order.avgPrice && (
                  <div className="mt-2 inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Avg Fill Price: ${order.avgPrice.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Right Section - Actions */}
              <div className="flex flex-col items-end gap-2">
                {canCancel && (
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={isCancelling}
                    className={`relative overflow-hidden px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      isCancelling
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                  >
                    {isCancelling ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Cancelling...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cancel Order
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-10 rounded-xl transition-opacity pointer-events-none"></div>
          </div>
        );
      })}
    </div>
  );
};

export default OrdersList;


