import { EventEmitter } from 'events';
import prisma from '@/db';
import { priceEngine } from './priceEngine';
import { Order, OrderUpdate, CreateOrderRequest } from '@/types';
import { InvalidOrderError, InsufficientFundsError, OrderNotFoundError, NotFoundError } from '@/utils/errors';
import logger from '@/utils/logger';

export class MatchingEngine extends EventEmitter {
  private orderLocks = new Map<string, Promise<void>>();

  constructor() {
    super();
    this.setupPriceListener();
  }

  private setupPriceListener(): void {
    priceEngine.on('priceUpdate', (ticks: Array<{ symbol: string; price: number }>) => {
      // Process each tick asynchronously
      ticks.forEach((tick: { symbol: string; price: number }) => {
        this.processPriceTick(tick.symbol, tick.price).catch((error) => {
          logger.error(`Error processing price tick for ${tick.symbol}:`, error);
        });
      });
    });
  }

  private async processPriceTick(symbol: string, currentPrice: number): Promise<void> {
    const lockKey = `symbol:${symbol}`;
    
    // Prevent concurrent processing of the same symbol
    if (this.orderLocks.has(lockKey)) {
      await this.orderLocks.get(lockKey);
    }

    const processingPromise = this.processOrdersForSymbol(symbol, currentPrice);
    this.orderLocks.set(lockKey, processingPromise);

    try {
      await processingPromise;
    } finally {
      this.orderLocks.delete(lockKey);
    }
  }

  private async processOrdersForSymbol(symbol: string, currentPrice: number): Promise<void> {
    try {
      // Get all open orders for this symbol
      const openOrders = await prisma.order.findMany({
        where: {
          symbol,
          status: 'open',
        },
        orderBy: {
          createdAt: 'asc', // FIFO
        },
      });

      for (const order of openOrders) {
        try {
          await this.processOrder(order as any as Order, currentPrice);
        } catch (error) {
          logger.error(`Error processing order ${order.id}:`, error);
        }
      }
    } catch (error) {
      logger.error(`Error processing orders for symbol ${symbol}:`, error);
    }
  }

  private async processOrder(order: Order, currentPrice: number): Promise<void> {
  const { side, type, qty, price: limitPrice, filledQty } = order as any;
    const remainingQty = Number(qty) - Number(filledQty);

    if (remainingQty <= 0) {
      return;
    }

    let shouldExecute = false;
    let executionPrice = currentPrice;

  if (type === 'market') {
      shouldExecute = true;
    } else if (type === 'limit' && limitPrice) {
      if (side === 'buy' && currentPrice <= Number(limitPrice)) {
        shouldExecute = true;
        executionPrice = Math.min(currentPrice, Number(limitPrice));
      } else if (side === 'sell' && currentPrice >= Number(limitPrice)) {
        shouldExecute = true;
        executionPrice = Math.max(currentPrice, Number(limitPrice));
      }
    }

    if (!shouldExecute) {
      return;
    }

    // Execute the order
    await this.executeOrder(order as any, executionPrice, remainingQty);
  }

  private async executeOrder(order: Order, executionPrice: number, qty: number): Promise<void> {
    const { id, userId, symbol, side, filledQty } = order;
    const totalFilledQty = Number(filledQty) + qty;
    const totalOrderQty = Number(order.qty);
    const isFullyFilled = totalFilledQty >= totalOrderQty;

    // Calculate new average price
    const currentValue = Number(filledQty) * (Number(order.avgPrice) || 0);
    const newValue = qty * executionPrice;
    const newAvgPrice = (currentValue + newValue) / totalFilledQty;

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        filledQty: totalFilledQty,
        avgPrice: newAvgPrice,
        status: isFullyFilled ? 'filled' : 'partial',
        updatedAt: new Date(),
      },
    });

    // Update user's position
    await this.updatePosition(userId, symbol, side, qty, executionPrice);

    // Emit order update
    const orderUpdate: OrderUpdate = {
      orderId: id,
      status: updatedOrder.status,
      filledQty: Number(updatedOrder.filledQty),
      avgPrice: Number(updatedOrder.avgPrice),
    };

    this.emit('orderUpdate', orderUpdate);
    logger.info(`Order ${id} executed: ${qty} ${symbol} at ${executionPrice}`);
  }

  private async updatePosition(userId: number, symbol: string, side: string, qty: number, price: number): Promise<void> {
    const existingPosition = await prisma.position.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol,
        },
      },
    });

    if (side === 'buy') {
      if (existingPosition) {
        // Update existing position
        const newQty = Number(existingPosition.qty) + qty;
        const newAvgPrice = ((Number(existingPosition.qty) * Number(existingPosition.avgPrice)) + (qty * price)) / newQty;

        await prisma.position.update({
          where: { id: existingPosition.id },
          data: {
            qty: newQty,
            avgPrice: newAvgPrice,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new position
        await prisma.position.create({
          data: {
            userId,
            symbol,
            qty,
            avgPrice: price,
          },
        });
      }
    } else {
      // Sell side
      if (!existingPosition || Number(existingPosition.qty) < qty) {
        throw new InvalidOrderError(`Insufficient position for sell order. Available: ${existingPosition ? Number(existingPosition.qty) : 0}, Requested: ${qty}`);
      }

      const newQty = Number(existingPosition.qty) - qty;
      
      if (newQty === 0) {
        // Close position
        await prisma.position.delete({
          where: { id: existingPosition.id },
        });
      } else {
        // Update position quantity (keep same average price)
        await prisma.position.update({
          where: { id: existingPosition.id },
          data: {
            qty: newQty,
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  public async createOrder(userId: number, orderData: CreateOrderRequest): Promise<Order> {
    const { symbol, side, type, qty, price } = orderData;

    // Validate order
    await this.validateOrder(userId, orderData);

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        symbol,
        side,
        type,
        qty,
        price: price || null,
        status: 'open',
        filledQty: 0,
      },
    });

    logger.info(`Created order ${order.id}: ${side} ${qty} ${symbol} ${type} ${price ? `@${price}` : ''}`);

    // If it's a market order, process it immediately
    if (type === 'market') {
      const currentPrice = priceEngine.getCurrentPrice(symbol);
      if (currentPrice) {
        // Process in next tick to avoid blocking
        setImmediate(() => {
          this.processOrder(order as any as Order, currentPrice).catch((error) => {
            logger.error(`Error processing market order ${order.id}:`, error);
          });
        });
      }
    }

  return order as any as Order;
  }

  private async validateOrder(userId: number, orderData: CreateOrderRequest): Promise<void> {
    const { symbol, side, qty } = orderData;

    if (qty <= 0) {
      throw new InvalidOrderError('Quantity must be positive');
    }

    if (side === 'buy') {
      // Check buying power
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const currentPrice = priceEngine.getCurrentPrice(symbol);
      if (!currentPrice) {
        throw new InvalidOrderError(`No current price available for ${symbol}`);
      }

      const estimatedCost = qty * currentPrice;
      if (estimatedCost > Number(user.startingCash)) {
        throw new InsufficientFundsError(`Insufficient funds. Required: ${estimatedCost.toFixed(2)}, Available: ${Number(user.startingCash).toFixed(2)}`);
      }
    } else {
      // Check position for sell orders
      const position = await prisma.position.findUnique({
        where: {
          userId_symbol: {
            userId,
            symbol,
          },
        },
      });

      if (!position || Number(position.qty) < qty) {
        throw new InvalidOrderError(`Insufficient position. Available: ${position ? Number(position.qty) : 0}, Requested: ${qty}`);
      }
    }
  }

  public async cancelOrder(userId: number, orderId: number): Promise<Order> {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: 'open',
      },
    });

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    logger.info(`Cancelled order ${orderId}`);

    // Emit order update
    const orderUpdate: OrderUpdate = {
      orderId,
      status: 'cancelled',
      filledQty: Number(updatedOrder.filledQty),
      avgPrice: Number(updatedOrder.avgPrice),
    };

    this.emit('orderUpdate', orderUpdate);

  return updatedOrder as any as Order;
  }

  public async getUserOrders(userId: number, status?: string): Promise<Order[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const result = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return result as any as Order[];

  }

  public async getOrder(userId: number, orderId: number): Promise<Order | null> {
    const result = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    return result as any as Order | null;
  }

}

// Singleton instance
export const matchingEngine = new MatchingEngine();

