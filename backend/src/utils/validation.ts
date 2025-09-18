import { z } from 'zod';
import { SUPPORTED_ORDER_TYPES, SUPPORTED_ORDER_SIDES } from '@/config';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(50, 'Username too long'),
});

export const createOrderSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol too long'),
  side: z.enum(SUPPORTED_ORDER_SIDES, {
    errorMap: () => ({ message: 'Side must be either "buy" or "sell"' }),
  }),
  type: z.enum(SUPPORTED_ORDER_TYPES, {
    errorMap: () => ({ message: 'Type must be either "market" or "limit"' }),
  }),
  qty: z.number().positive('Quantity must be positive'),
  price: z.number().positive('Price must be positive').optional(),
}).refine((data) => {
  if (data.type === 'limit' && !data.price) {
    return false;
  }
  return true;
}, {
  message: 'Price is required for limit orders',
  path: ['price'],
});

export const orderIdSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid order ID');
    }
    return num;
  }),
});

export const symbolSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
});

export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => {
    if (!val) return 1;
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 ? 1 : num;
  }),
  limit: z.string().optional().transform((val) => {
    if (!val) return 50;
    const num = parseInt(val, 10);
    return isNaN(num) || num < 1 || num > 100 ? 50 : num;
  }),
});

export const dateRangeSchema = z.object({
  from: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
  }),
  to: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
  }),
});

