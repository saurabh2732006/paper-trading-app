export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message = 'Insufficient funds') {
    super(message, 400, 'INSUFFICIENT_FUNDS');
  }
}

export class OrderNotFoundError extends AppError {
  constructor(orderId: number) {
    super(`Order ${orderId} not found`, 404, 'ORDER_NOT_FOUND');
  }
}

export class OrderNotCancellableError extends AppError {
  constructor(orderId: number) {
    super(`Order ${orderId} cannot be cancelled`, 400, 'ORDER_NOT_CANCELLABLE');
  }
}

export class InvalidOrderError extends AppError {
  constructor(message: string) {
    super(message, 400, 'INVALID_ORDER');
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network connection error') {
    super(message, 503, 'NETWORK_ERROR');
  }
}

export class DatabaseConnectionError extends AppError {
  constructor(message = 'Database connection failed') {
    super(message, 503, 'DATABASE_CONNECTION_ERROR');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Request timeout') {
    super(message, 408, 'TIMEOUT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export const errorHandler = (error: Error, req: any, res: any, _next: any) => {
  // Handle specific error types
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
      ...(process.env['NODE_ENV'] === 'development' && {
        stack: error.stack,
        path: req.path,
        method: req.method,
      }),
    });
  }

  // Handle database connection errors
  if (error.message.includes('ECONNREFUSED') || error.message.includes('database')) {
    console.error('Database connection error:', error);
    return res.status(503).json({
      status: 'error',
      message: 'Database connection failed. Please check your connection and try again.',
      code: 'DATABASE_CONNECTION_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle network-related errors
  if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNRESET') || error.message.includes('timeout')) {
    console.error('Network error:', error);
    return res.status(503).json({
      status: 'error',
      message: 'Network error. Please check your connection and try again.',
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid JSON format in request body',
      code: 'INVALID_JSON',
      timestamp: new Date().toISOString(),
    });
  }

  // Handle CORS errors
  if (error.message.includes('CORS') || error.message.includes('Not allowed by CORS')) {
    return res.status(403).json({
      status: 'error',
      message: 'CORS policy violation. Please check your request origin.',
      code: 'CORS_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  // Log unexpected errors with more context
  console.error('Unexpected error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  return res.status(500).json({
    status: 'error',
    message: process.env['NODE_ENV'] === 'development'
      ? `Internal server error: ${error.message}`
      : 'Internal server error. Please try again later.',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    ...(process.env['NODE_ENV'] === 'development' && {
      stack: error.stack,
      path: req.path,
      method: req.method,
    }),
  });
};

