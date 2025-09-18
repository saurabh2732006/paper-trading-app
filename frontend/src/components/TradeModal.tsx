import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, TrendingUp, TrendingDown, DollarSign, Hash, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { ordersApi, tickersApi } from '@/lib/api';
import { CreateOrderRequest } from '@/types';
import { useCurrency } from '@/contexts/CurrencyContext';
import toast from 'react-hot-toast';

interface TradeModalProps {
  symbol?: string | null;
  onClose: () => void;
  onTradeComplete: () => void;
}

const tradeSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['buy', 'sell'], { required_error: 'Please select buy or sell' }),
  type: z.enum(['market', 'limit'], { required_error: 'Please select order type' }),
  qty: z.number().min(0.01, 'Quantity must be at least 0.01'),
  price: z.number().min(0.01, 'Price must be positive').optional(),
}).refine((data) => {
  if (data.type === 'limit' && !data.price) {
    return false;
  }
  return true;
}, {
  message: 'Price is required for limit orders',
  path: ['price'],
});

type TradeFormData = z.infer<typeof tradeSchema>;

const TradeModal: React.FC<TradeModalProps> = ({ symbol, onClose, onTradeComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const { formatAmount } = useCurrency();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      symbol: symbol || '',
      side: 'buy',
      type: 'market',
      qty: 1,
    },
  });

  const watchedType = watch('type');
  const watchedSide = watch('side');
  const watchedQty = watch('qty');

  // Fetch current price for the symbol
  useEffect(() => {
    if (symbol) {
      const fetchPrice = async () => {
        try {
          const response = await tickersApi.getTickers();
          if (response.status === 'success' && response.data) {
            const ticker = response.data.find(t => t.symbol === symbol);
            if (ticker) {
              setCurrentPrice(ticker.price);
            }
          }
        } catch (error) {
          console.error('Error fetching current price:', error);
        }
      };

      fetchPrice();
    }
  }, [symbol]);

  const onSubmit = async (data: TradeFormData) => {
    try {
      setIsLoading(true);
      
      const orderData: CreateOrderRequest = {
        symbol: data.symbol,
        side: data.side,
        type: data.type,
        qty: data.qty,
        price: data.type === 'limit' ? data.price : undefined,
      };

      const response = await ordersApi.createOrder(orderData);
      
      if (response.status === 'success') {
        toast.success('Order placed successfully!');
        onTradeComplete();
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to place order';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const estimatedCost = currentPrice && watchedQty ? currentPrice * watchedQty : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Place Order</h2>
              <p className="text-sm text-gray-600">Trade with confidence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Symbol */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <Hash className="h-4 w-4 mr-1" />
              Symbol
            </label>
            <div className="relative">
              <input
                {...register('symbol')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter symbol (e.g., AAPL)"
              />
              {currentPrice && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  {formatAmount(currentPrice)}
                </div>
              )}
            </div>
            {errors.symbol && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.symbol.message}
              </div>
            )}
          </div>

          {/* Side */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              Trade Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('side', 'buy')}
                className={`relative overflow-hidden py-4 px-6 rounded-xl border-2 font-semibold transition-all duration-200 ${
                  watchedSide === 'buy' 
                    ? 'bg-green-600 border-green-600 text-white shadow-lg transform scale-105' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Buy
                </div>
                {watchedSide === 'buy' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setValue('side', 'sell')}
                className={`relative overflow-hidden py-4 px-6 rounded-xl border-2 font-semibold transition-all duration-200 ${
                  watchedSide === 'sell' 
                    ? 'bg-red-600 border-red-600 text-white shadow-lg transform scale-105' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 mr-2" />
                  Sell
                </div>
                {watchedSide === 'sell' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </button>
            </div>
            {errors.side && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.side.message}
              </div>
            )}
          </div>

          {/* Order Type */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <Clock className="h-4 w-4 mr-1" />
              Order Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('type', 'market')}
                className={`relative py-3 px-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                  watchedType === 'market' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                Market
                {watchedType === 'market' && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setValue('type', 'limit')}
                className={`relative py-3 px-4 rounded-xl border-2 font-medium transition-all duration-200 ${
                  watchedType === 'limit' 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                Limit
                {watchedType === 'limit' && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle className="h-3 w-3" />
                  </div>
                )}
              </button>
            </div>
            {errors.type && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.type.message}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-semibold text-gray-700">
              <Hash className="h-4 w-4 mr-1" />
              Quantity
            </label>
            <input
              {...register('qty', { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0.01"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter quantity"
            />
            {errors.qty && (
              <div className="flex items-center mt-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.qty.message}
              </div>
            )}
          </div>

          {/* Price (for limit orders) */}
          {watchedType === 'limit' && (
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <DollarSign className="h-4 w-4 mr-1" />
                Limit Price
              </label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0.01"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter limit price"
              />
              {errors.price && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.price.message}
                </div>
              )}
            </div>
          )}

          {/* Order Summary */}
          {currentPrice && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Current Price:
                  </span>
                  <span className="font-bold text-gray-900">{formatAmount(currentPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    <Hash className="h-4 w-4 mr-1" />
                    Quantity:
                  </span>
                  <span className="font-bold text-gray-900">{watchedQty}</span>
                </div>
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">Estimated Total:</span>
                    <span className="font-bold text-xl text-blue-600">{formatAmount(estimatedCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-3 px-4 font-semibold rounded-xl transition-all duration-200 ${
                watchedSide === 'buy'
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Placing Order...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {watchedSide === 'buy' ? (
                    <TrendingUp className="h-5 w-5 mr-2" />
                  ) : (
                    <TrendingDown className="h-5 w-5 mr-2" />
                  )}
                  {watchedSide === 'buy' ? 'Buy Now' : 'Sell Now'}
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeModal;
