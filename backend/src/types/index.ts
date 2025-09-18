export interface User {
  id: number;
  username: string;
  startingCash: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: number;
  userId: number;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  qty: number;
  price?: number;
  status: 'open' | 'filled' | 'cancelled' | 'partial';
  filledQty: number;
  avgPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  id: number;
  userId: number;
  symbol: string;
  qty: number;
  avgPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Price {
  id: number;
  symbol: string;
  ts: Date;
  price: number;
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

export interface LoginRequest {
  username: string;
}

export interface JWTPayload {
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

