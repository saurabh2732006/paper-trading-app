import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationOptions {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: NotificationAction;
}

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const getToastStyle = (type: NotificationType) => {
  const base = 'flex items-start gap-3 p-3 rounded-lg shadow max-w-sm';
  switch (type) {
    case 'success':
      return `${base} bg-white dark:bg-gray-800 border border-green-200`;
    case 'error':
      return `${base} bg-white dark:bg-gray-800 border border-red-200`;
    case 'warning':
      return `${base} bg-white dark:bg-gray-800 border border-yellow-200`;
    default:
      return `${base} bg-white dark:bg-gray-800 border border-blue-200`;
  }
};

export const show = (opts: NotificationOptions) => {
  const { type, title, message, duration = 5000, action } = opts;

  const node = (
    <div className={getToastStyle(type)}>
      <div className="mt-0.5">{getIcon(type)}</div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{title}</div>
        {message && <div className="text-sm text-gray-600 dark:text-gray-300">{message}</div>}
        {action && (
          <div className="mt-2">
            <button onClick={action.onClick} className="text-sm font-medium underline">
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return toast(node, { duration, position: 'top-right' });
};

export const success = (title: string, message?: string, options?: Partial<NotificationOptions>) =>
  show({ type: 'success', title, message, duration: options?.duration, action: options?.action });

export const info = (title: string, message?: string, options?: Partial<NotificationOptions>) =>
  show({ type: 'info', title, message, duration: options?.duration, action: options?.action });

export const warning = (title: string, message?: string, options?: Partial<NotificationOptions>) =>
  show({ type: 'warning', title, message, duration: options?.duration, action: options?.action });

export const error = (title: string, message?: string, options?: Partial<NotificationOptions>) =>
  show({ type: 'error', title, message, duration: options?.duration ?? 7000, action: options?.action });

// Trading-specific helpers
export const orderFilled = (symbol: string, qty: number, price: number, side: 'buy' | 'sell') =>
  success('Order Filled', `${side.toUpperCase()} ${qty} ${symbol} @ ${price}`, { duration: 4000 });

export const orderCancelled = (symbol: string, qty: number) =>
  info('Order Cancelled', `${qty} ${symbol} order cancelled`, { duration: 3000 });

export const orderRejected = (symbol: string, reason: string) =>
  error('Order Rejected', `${symbol}: ${reason}`, { duration: 6000 });

export const insufficientFunds = (required: number, available: number) =>
  error('Insufficient Funds', `Required: ${required}, Available: ${available}`, { duration: 6000 });

export const insufficientPosition = (symbol: string, required: number, available: number) =>
  error('Insufficient Position', `${symbol}: Required ${required}, Available ${available}`, { duration: 6000 });

export const priceAlert = (symbol: string, price: number, condition: 'above' | 'below') =>
  info('Price Alert', `${symbol} is ${condition} ${price}`, { duration: 4000 });

// API error helper that understands axios-style and our backend error shape
export const apiError = (err: any) => {
  const isAxios = !!err?.isAxiosError;
  const network = isAxios && !err.response;

  if (network) {
    return error('Network Error', 'Unable to connect to the server. Please check your internet connection.', {
      action: {
        label: 'Retry',
        onClick: async () => {
          if (typeof err.retry === 'function') {
            try {
              const res = await err.retry();
              success('Success', 'Request completed successfully');
              return res;
            } catch (e: any) {
              error('Retry Failed', e?.message || 'Retry failed');
            }
          } else {
            window.location.reload();
          }
        },
      },
    });
  }

  const code = err?.code || err?.errorCode || err?.status;
  const message = err?.message || err?.statusText || String(err ?? 'An error occurred');

  switch (code) {
    case 'VALIDATION_ERROR':
      return error('Invalid Input', message);
    case 'AUTHENTICATION_ERROR':
      return error('Authentication Required', 'Please log in to continue');
    case 'AUTHORIZATION_ERROR':
      return error('Access Denied', "You don't have permission to perform this action");
    case 'NOT_FOUND':
      return error('Not Found', message || 'The requested resource was not found');
    case 'INSUFFICIENT_FUNDS':
      return error('Insufficient Funds', message);
    case 'INVALID_ORDER':
      return error('Invalid Order', message);
    case 'ORDER_NOT_FOUND':
      return error('Order Not Found', message);
    case 'ORDER_NOT_CANCELLABLE':
      return error('Cannot Cancel Order', message);
    case 500:
    case 'INTERNAL_ERROR':
      return error('Server Error', 'Something went wrong on our end. Please try again later.', {
        action: {
          label: 'Retry',
          onClick: async () => {
            if (typeof err.retry === 'function') {
              try {
                const res = await err.retry();
                success('Success', 'Request completed successfully');
                return res;
              } catch (e: any) {
                error('Retry Failed', e?.message || 'Retry failed');
              }
            } else {
              window.location.reload();
            }
          }
        },
      });
    default:
      return error('Error', message);
  }
};

export default {
  show,
  success,
  info,
  warning,
  error,
  apiError,
  orderFilled,
  orderCancelled,
  orderRejected,
  insufficientFunds,
  insufficientPosition,
  priceAlert,
};