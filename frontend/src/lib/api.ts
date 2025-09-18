import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { ApiResponse, User, AccountSnapshot, Ticker, Order, Position, PriceHistory, CreateOrderRequest } from '@/types';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 10000; // 10 seconds

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Retry helper function
const retryRequest = async (config: AxiosRequestConfig, retryCount = 0): Promise<any> => {
  try {
    return await api.request(config);
  } catch (error) {
    if (retryCount < MAX_RETRIES && shouldRetry(error as AxiosError)) {
      console.log(`🔄 Retrying request (${retryCount + 1}/${MAX_RETRIES}):`, config.url);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return retryRequest(config, retryCount + 1);
    }
    throw error;
  }
};

// Determine if request should be retried
const shouldRetry = (error: AxiosError): boolean => {
  // Retry on network errors or specific HTTP status codes
  if (!error.response) {
    return true; // Network error
  }
  
  const status = error.response.status;
  return status >= 500 || status === 408 || status === 429; // Server errors, timeout, rate limit
};

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error: AxiosError) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url, error.message);
    
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      console.warn('🔐 Unauthorized access - redirecting to login');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Create enhanced error object
    const enhancedError: any = {
      ...error,
      message: getErrorMessage(error),
      code: getErrorCode(error),
      status: error.response?.status || 0,
      isApiError: true,
      timestamp: new Date().toISOString(),
    };

    // Add retry function
    if (error.config && shouldRetry(error)) {
      enhancedError.retry = () => retryRequest(error.config!);
    }

    return Promise.reject(enhancedError);
  }
);

// Extract error message from different error formats
const getErrorMessage = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;
    return data.message || data.error || 'An error occurred';
  }
  
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    return 'Network error. Please check your connection and try again.';
  }
  
  return error.message || 'Unknown error occurred';
};

// Extract error code
const getErrorCode = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;
    return data.code || 'API_ERROR';
  }
  
  return error.code || 'NETWORK_ERROR';
};

export const authApi = {
  login: async (username: string): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.post('/auth/login', { username });
    return response.data;
  },

  logout: async (): Promise<ApiResponse> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  resetAccount: async (userId: number): Promise<ApiResponse> => {
    const response = await api.post('/auth/reset', { userId });
    return response.data;
  },
};

export const accountApi = {
  getSnapshot: async (): Promise<ApiResponse<AccountSnapshot>> => {
    const response = await api.get('/account');
    return response.data;
  },

  getPositions: async (): Promise<ApiResponse<Position[]>> => {
    const response = await api.get('/account/positions');
    return response.data;
  },

  getHistory: async (page = 1, limit = 50): Promise<ApiResponse<Order[]>> => {
    const response = await api.get('/account/history', {
      params: { page, limit },
    });
    return response.data;
  },
};

export const tickersApi = {
  getTickers: async (): Promise<ApiResponse<Ticker[]>> => {
    const response = await api.get('/tickers');
    return response.data;
  },

  getPriceHistory: async (symbol: string, from?: string, to?: string): Promise<ApiResponse<PriceHistory[]>> => {
    const response = await api.get(`/tickers/${symbol}/history`, {
      params: { from, to },
    });
    return response.data;
  },
};

export const ordersApi = {
  createOrder: async (orderData: CreateOrderRequest): Promise<ApiResponse<Order>> => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  getOrders: async (status?: string): Promise<ApiResponse<Order[]>> => {
    const response = await api.get('/orders', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  getOrder: async (id: number): Promise<ApiResponse<Order>> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancelOrder: async (id: number): Promise<ApiResponse<Order>> => {
    const response = await api.delete(`/orders/${id}`);
    return response.data;
  },
};

export const exchangeRateApi = {
  getExchangeRate: async (): Promise<ApiResponse<{ base: string; target: string; rate: number; updatedAt: string }>> => {
    const response = await api.get('/exchange-rate');
    return response.data;
  },
};

export default api;
