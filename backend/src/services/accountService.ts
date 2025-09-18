import prisma from '@/db';
import { priceEngine } from './priceEngine';
import { AccountSnapshot } from '@/types';

export class AccountService {
  public async getAccountSnapshot(userId: number): Promise<AccountSnapshot> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get all positions
    const positions = await prisma.position.findMany({
      where: { userId },
    });

    // Get current prices
    const currentPrices = priceEngine.getCurrentPrices();

    // Calculate position values and P&L
    let totalValue = Number(user.startingCash);
    const positionSnapshots = positions.map((position) => {
      const currentPrice = currentPrices.get(position.symbol) || Number(position.avgPrice);
      const value = Number(position.qty) * currentPrice;
      const unrealizedPnL = value - (Number(position.qty) * Number(position.avgPrice));
      
      totalValue += value;

      return {
        symbol: position.symbol,
        qty: Number(position.qty),
        avgPrice: Number(position.avgPrice),
        currentPrice,
        value,
        unrealizedPnL,
      };
    });

    // Calculate daily P&L (simplified - using current vs avg price)
    const dailyPnL = positionSnapshots.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);

    return {
      userId,
      cash: Number(user.startingCash),
      totalValue,
      dailyPnL,
      positions: positionSnapshots,
    };
  }

  public async getTransactionHistory(userId: number, limit = 50, offset = 0): Promise<any[]> {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return orders.map((order) => ({
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
  }

  public async getPositions(userId: number): Promise<any[]> {
    const positions = await prisma.position.findMany({
      where: { userId },
    });

    const currentPrices = priceEngine.getCurrentPrices();

    return positions.map((position) => {
      const currentPrice = currentPrices.get(position.symbol) || Number(position.avgPrice);
      const value = Number(position.qty) * currentPrice;
      const unrealizedPnL = value - (Number(position.qty) * Number(position.avgPrice));

      return {
        id: position.id,
        symbol: position.symbol,
        qty: Number(position.qty),
        avgPrice: Number(position.avgPrice),
        currentPrice,
        value,
        unrealizedPnL,
        createdAt: position.createdAt,
        updatedAt: position.updatedAt,
      };
    });
  }
}

export const accountService = new AccountService();

