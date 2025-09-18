import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '@/services/authService';
import { loginSchema } from '@/utils/validation';
import { ValidationError } from '@/utils/errors';
import logger from '@/utils/logger';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Enhanced validation
    if (!validatedData.username || validatedData.username.trim().length === 0) {
      throw new ValidationError('Username is required and cannot be empty');
    }
    
    if (validatedData.username.length < 3 || validatedData.username.length > 20) {
      throw new ValidationError('Username must be between 3 and 20 characters');
    }
    
    // Sanitize username
    const sanitizedUsername = validatedData.username.trim().toLowerCase();
    
    logger.info('Login attempt', { username: sanitizedUsername });
    
    const { user, token } = await authService.login(sanitizedUsername);

    // Set HttpOnly cookie with enhanced security
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });

    logger.info('Login successful', { userId: user.id, username: user.username });

    res.json({
      status: 'success',
      message: 'Login successful',
      data: { user },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      logger.error('Login validation failed', {
        validationErrors: fieldErrors,
      });
      
      throw new ValidationError(`Validation failed: ${fieldErrors.map(e => e.message).join(', ')}`);
    }
    
    logger.error('Login error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    throw error;
  }
});

// POST /api/auth/logout
router.post('/logout', async (_req: Request, res: Response): Promise<void> => {
  try {
    logger.info('User logout');
    
    await authService.logout();
    
    // Clear cookie with same options as when it was set
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      path: '/'
    });
    
    res.json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
});

// POST /api/auth/reset
router.post('/reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    
    // Enhanced validation
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    if (typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
      throw new ValidationError('User ID must be a positive integer');
    }
    
    logger.info('Account reset requested', { userId });

    await authService.resetUserAccount(userId);
    
    logger.info('Account reset completed', { userId });
    
    res.json({
      status: 'success',
      message: 'Account reset successfully',
      data: {
        userId,
        resetAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Reset account error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
});

export default router;

