export interface User {
  id: number;
  username: string;
  startingCash: number;
  createdAt: string;
}

export interface Order {
  id: number;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  qty: number;
  price?: number;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  filledQty: number;
  avgPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: number;
  symbol: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  unrealizedPnL: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ticker {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface PriceHistory {
  symbol: string;
  ts: string;
  price: number;
}

export interface AccountSnapshot {
  userId: number;
  cash: number;
  totalValue: number;
  dailyPnL: number;
  positions: Array<{
    symbol: string;
    qty: number;
    avgPrice: number;
    currentPrice: number;
    value: number;
    unrealizedPnL: number;
  }>;
}

export interface CreateOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  qty: number;
  price?: number;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  code?: string;
}

export interface PriceTick {
  symbol: string;
  price: number;
  ts: number;
  change: number;
  changePercent: number;
}

export interface OrderUpdate {
  orderId: number;
  status: string;
  filledQty: number;
  avgPrice?: number;
}

export interface WebSocketMessage {
  type: 'priceUpdate' | 'orderUpdate' | 'connected' | 'ping' | 'pong' | 'error';
  data: PriceTick[] | OrderUpdate | any;
}


