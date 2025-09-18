import { useState, useCallback } from 'react';
import * as notificationService from '@/services/notificationService';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: any;
}

interface UseApiOptions {
  showErrorToast?: boolean;
  successMessage?: string;
}


export function useApi<T>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Exponential backoff retry logic
  const retryWithBackoff = async (
    fn: () => Promise<any>,
    retries = 3,
    delay = 500,
    maxDelay = 4000
  ): Promise<any> => {
    try {
      return await fn();
    } catch (err) {
      if (retries <= 0) throw err;
      await new Promise(res => setTimeout(res, delay));
      return retryWithBackoff(fn, retries - 1, Math.min(delay * 2, maxDelay), maxDelay);
    }
  };

  const execute = useCallback(async <R>(
    apiCall: () => Promise<R>,
    options: UseApiOptions = {},
    retryCount = 0
  ): Promise<R | null> => {
    const { showErrorToast = true, successMessage } = options;

    setState(prev => ({ ...prev, loading: true, error: null }));

    const retryFn = () => execute(apiCall, options, retryCount);

    try {
      // If retryCount > 0, use backoff
      const result = retryCount > 0
        ? await retryWithBackoff(apiCall, retryCount)
        : await apiCall();

      setState({
        data: result as T,
        loading: false,
        error: null,
      });

      if (successMessage) {
        notificationService.success('Success', successMessage);
      }

      return result;
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error,
      });

      if (showErrorToast) {
        // Pass retryFn for network errors
        if (error?.code === 'NETWORK_ERROR') {
          notificationService.apiError({ ...error, retryFn });
        } else {
          notificationService.apiError(error);
        }
      }

      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specialized hook for order operations
export function useOrderOperations() {
  const createOrder = useApi();
  const cancelOrder = useApi();
  const getOrders = useApi();

  const handleCreateOrder = useCallback(async (orderData: any) => {
    return createOrder.execute(
      () => import('@/lib/api').then(api => api.ordersApi.createOrder(orderData)),
      {
        showErrorToast: true,
        successMessage: 'Order created successfully',
      }
    );
  }, [createOrder]);

  const handleCancelOrder = useCallback(async (orderId: number) => {
    return cancelOrder.execute(
      () => import('@/lib/api').then(api => api.ordersApi.cancelOrder(orderId)),
      {
        showErrorToast: true,
        successMessage: 'Order cancelled successfully',
      }
    );
  }, [cancelOrder]);

  const handleGetOrders = useCallback(async (status?: string) => {
    return getOrders.execute(
      () => import('@/lib/api').then(api => api.ordersApi.getOrders(status)),
      { showErrorToast: false } // Don't show error for fetching orders
    );
  }, [getOrders]);

  return {
    createOrder: handleCreateOrder,
    cancelOrder: handleCancelOrder,
    getOrders: handleGetOrders,
    loading: createOrder.loading || cancelOrder.loading || getOrders.loading,
    error: createOrder.error || cancelOrder.error || getOrders.error,
  };
}