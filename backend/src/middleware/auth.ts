import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { JWTPayload } from '@/types';
import { AuthenticationError } from '@/utils/errors';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies?.['token'];

    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    
    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AuthenticationError('Invalid authentication token'));
    } else {
      next(error);
    }
  }
};

