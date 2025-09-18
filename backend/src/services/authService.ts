import jwt from 'jsonwebtoken';
import prisma from '@/db';
import { config } from '@/config';
import { JWTPayload } from '@/types';
import { AuthenticationError } from '@/utils/errors';
import logger from '@/utils/logger';

export class AuthService {
  public async login(username: string): Promise<{ user: any; token: string }> {
    try {
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        // Create new user with default starting cash
        user = await prisma.user.create({
          data: {
            username,
            startingCash: 100000, // $100,000 starting cash
          },
        });
        logger.info(`Created new user: ${username}`);
      }

      // Generate JWT token
      // jwt typings are strict; cast secret and options to any for now
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
        } as JWTPayload,
        config.jwtSecret as any,
        { expiresIn: config.jwtExpiresIn } as any
      );

      logger.info(`User ${username} logged in`);

      return {
        user: {
          id: user.id,
          username: user.username,
          startingCash: Number(user.startingCash),
          createdAt: user.createdAt,
        },
        token,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw new AuthenticationError('Login failed');
    }
  }

  public async logout(): Promise<void> {
    // In a stateless JWT system, logout is handled client-side
    // by removing the token from cookies
    logger.info('User logged out');
  }

  public async getUserById(userId: number): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      startingCash: Number(user.startingCash),
      createdAt: user.createdAt,
    };
  }

  public async resetUserAccount(userId: number): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete all user's orders
        await tx.order.deleteMany({
          where: { userId },
        });

        // Delete all user's positions
        await tx.position.deleteMany({
          where: { userId },
        });

        // Reset user's starting cash
        await tx.user.update({
          where: { id: userId },
          data: { startingCash: 100000 },
        });
      });

      logger.info(`Reset account for user ${userId}`);
    } catch (error) {
      logger.error('Error resetting user account:', error);
      throw new Error('Failed to reset account');
    }
  }
}

export const authService = new AuthService();

