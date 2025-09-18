import React from 'react';
import { Order } from '@/types';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface RecentOrdersProps {
  orders: Order[];
}

const RecentOrders: React.FC<RecentOrdersProps> = ({ orders }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'filled':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No recent orders</p>
        <p className="text-sm">Your trading activity will appear here</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              {getStatusIcon(order.status)}
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900">
                    {order.side.toUpperCase()} {order.qty} {order.symbol}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {order.type.toUpperCase()} order
                  {order.price && ` @ $${order.price.toFixed(2)}`}
                  {order.filledQty > 0 && (
                    <span className="ml-2">
                      • Filled: {order.filledQty}/{order.qty}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {formatDate(order.createdAt)}
              </div>
              {order.avgPrice && (
                <div className="text-sm font-medium text-gray-900">
                  Avg: ${order.avgPrice.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOrders;


