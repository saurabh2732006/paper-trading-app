import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '@/middleware/auth';
import { matchingEngine } from '@/services/matchingEngine';
import { createOrderSchema, orderIdSchema } from '@/utils/validation';
import { ValidationError, OrderNotFoundError, AuthenticationError } from '@/utils/errors';
import logger from '@/utils/logger';

const router = Router();

// POST /api/orders
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      logger.error('Order creation failed: User not authenticated');
      throw new AuthenticationError();
    }

    // Enhanced validation with custom error messages
    const validatedData = createOrderSchema.parse(req.body);
    
    // Additional business logic validation
    if (validatedData.qty <= 0) {
      throw new ValidationError('Order quantity must be greater than 0');
    }
    
    if (validatedData.type === 'limit' && (!validatedData.price || validatedData.price <= 0)) {
      throw new ValidationError('Limit orders must have a valid price greater than 0');
    }
    
    if (validatedData.type === 'market' && validatedData.price) {
      throw new ValidationError('Market orders cannot specify a price');
    }
    
    // Symbol validation (basic format check)
    if (!/^[A-Z]{2,6}$/.test(validatedData.symbol)) {
      throw new ValidationError('Symbol must be 2-6 uppercase letters');
    }
    
    logger.info('Creating order', {
      userId: req.user.id,
      symbol: validatedData.symbol,
      side: validatedData.side,
      type: validatedData.type,
      qty: validatedData.qty,
      price: validatedData.price
    });

    // Cast validatedData to any to satisfy CreateOrderRequest typing with exactOptionalPropertyTypes
    const order = await matchingEngine.createOrder(req.user.id, validatedData as any);

    logger.info('Order created successfully', { orderId: order.id, userId: req.user.id });

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        qty: Number(order.qty),
        price: order.price ? Number(order.price) : null,
        status: order.status,
        filledQty: Number(order.filledQty),
        avgPrice: order.avgPrice ? Number(order.avgPrice) : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      logger.error('Order validation failed', {
        userId: req.user?.id,
        validationErrors: fieldErrors,
      });
      
      throw new ValidationError(`Validation failed: ${fieldErrors.map(e => e.message).join(', ')}`);
    }

    logger.error('Order creation failed', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error;
  }
});

// GET /api/orders
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      logger.error('Get orders failed: User not authenticated');
      throw new AuthenticationError();
    }

    const { status, limit, offset } = req.query;
    
    // Validate query parameters
    if (status && typeof status !== 'string') {
      throw new ValidationError('Status filter must be a string');
    }
    
    if (status && !['open', 'filled', 'cancelled', 'partial'].includes(status)) {
      throw new ValidationError('Invalid status filter. Must be one of: open, filled, cancelled, partial');
    }
    
    // Parse pagination parameters
    const parsedLimit = limit ? Math.min(parseInt(limit as string, 10), 100) : 50;
    const parsedOffset = offset ? Math.max(parseInt(offset as string, 10), 0) : 0;
    
    if (isNaN(parsedLimit) || isNaN(parsedOffset)) {
      throw new ValidationError('Limit and offset must be valid numbers');
    }
    
    logger.info('Fetching user orders', {
      userId: req.user.id,
      status: status || 'all',
      limit: parsedLimit,
      offset: parsedOffset
    });

    const orders = await matchingEngine.getUserOrders(req.user.id, status as string);
    
    // Apply pagination
    const paginatedOrders = orders.slice(parsedOffset, parsedOffset + parsedLimit);

    const formattedOrders = paginatedOrders.map((order) => ({
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      qty: Number(order.qty),
      price: order.price ? Number(order.price) : null,
      status: order.status,
      filledQty: Number(order.filledQty),
      avgPrice: order.avgPrice ? Number(order.avgPrice) : null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    res.json({
      status: 'success',
      data: formattedOrders,
      meta: {
        total: orders.length,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < orders.length
      }
    });
  } catch (error) {
    logger.error('Get orders error:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
});

// GET /api/orders/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new Error('User not authenticated');
    }

    const { id } = orderIdSchema.parse(req.params);
    const order = await matchingEngine.getOrder(req.user.id, id);

    if (!order) {
      throw new OrderNotFoundError(id);
    }

    res.json({
      status: 'success',
      data: {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        qty: Number(order.qty),
        price: order.price ? Number(order.price) : null,
        status: order.status,
        filledQty: Number(order.filledQty),
        avgPrice: order.avgPrice ? Number(order.avgPrice) : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = (error.errors && error.errors[0] && (error.errors[0].message as string)) || 'Invalid input';
      throw new ValidationError(msg);
    }
    throw error;
  }
});

// DELETE /api/orders/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      logger.error('Cancel order failed: User not authenticated');
      throw new AuthenticationError();
    }

    const { id } = orderIdSchema.parse(req.params);
    
    logger.info('Cancelling order', {
      userId: req.user.id,
      orderId: id
    });
    
    const order = await matchingEngine.cancelOrder(req.user.id, id);

    logger.info('Order cancelled successfully', {
      userId: req.user.id,
      orderId: id,
      symbol: order.symbol
    });

    res.json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        qty: Number(order.qty),
        price: order.price ? Number(order.price) : null,
        status: order.status,
        filledQty: Number(order.filledQty),
        avgPrice: order.avgPrice ? Number(order.avgPrice) : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = (error.errors && error.errors[0] && (error.errors[0].message as string)) || 'Invalid order ID';
      logger.error('Order ID validation failed', {
        userId: req.user?.id,
        validationErrors: error.errors,
      });
      throw new ValidationError(msg);
    }
    
    logger.error('Cancel order error:', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw error;
  }
});

export default router;

