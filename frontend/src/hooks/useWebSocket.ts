import { useEffect, useRef, useState, useCallback } from 'react';
import { PriceTick, OrderUpdate, WebSocketMessage } from '@/types';
import toast from 'react-hot-toast';

interface UseWebSocketOptions {
  userId?: number;
  onPriceUpdate?: (ticks: PriceTick[]) => void;
  onOrderUpdate?: (update: OrderUpdate) => void;
  autoReconnect?: boolean;
}

interface WebSocketStatus {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

export const useWebSocket = ({ 
  userId, 
  onPriceUpdate, 
  onOrderUpdate, 
  autoReconnect = true 
}: UseWebSocketOptions) => {
  const [status, setStatus] = useState<WebSocketStatus>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 10;
  const heartbeatInterval = 30000; // 30 seconds
  const connectionTimeout = 10000; // 10 seconds

  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const updateStatus = useCallback((updates: Partial<WebSocketStatus>) => {
    setStatus(prev => ({ ...prev, ...updates }));
  }, []);

  const startHeartbeat = useCallback(() => {
    clearTimeouts();
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        // Browser WebSocket doesn't have ping, we'll send a custom heartbeat
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Failed to send heartbeat:', error);
        }
      }
    }, heartbeatInterval);
  }, [clearTimeouts]);

  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/prices${userId ? `?userId=${userId}` : ''}`;
  }, [userId]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (status.isConnecting) {
      return;
    }

    updateStatus({ isConnecting: true, error: null });
    console.log('🔌 Attempting WebSocket connection...');

    try {
      const wsUrl = getWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      
      // Connection timeout
      const connectionTimer = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          updateStatus({ 
            isConnecting: false, 
            error: 'Connection timeout' 
          });
          toast.error('WebSocket connection timeout');
        }
      }, connectionTimeout);
      
      ws.onopen = () => {
        clearTimeout(connectionTimer);
        console.log('✅ WebSocket connected successfully');
        updateStatus({
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0
        });
        startHeartbeat();
        toast.success('Real-time connection established', { id: 'ws-connection' });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              console.log('👋 WebSocket welcome message:', message.data);
              break;
            case 'priceUpdate':
              if (onPriceUpdate) {
                onPriceUpdate(message.data as PriceTick[]);
              }
              break;
            case 'orderUpdate':
              if (onOrderUpdate) {
                onOrderUpdate(message.data as OrderUpdate);
              }
              break;
            default:
              console.log('💬 Unknown WebSocket message:', message);
          }
        } catch (err) {
          console.error('❌ Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        clearTimeout(connectionTimer);
        clearTimeouts();
        
        console.log('🚪 WebSocket disconnected:', event.code, event.reason);
        updateStatus({ isConnected: false, isConnecting: false });
        wsRef.current = null;
        
        // Attempt to reconnect if enabled and not a deliberate close
        if (autoReconnect && event.code !== 1000 && status.reconnectAttempts < maxReconnectAttempts) {
          const newAttempts = status.reconnectAttempts + 1;
          const delay = Math.min(1000 * Math.pow(2, newAttempts), 30000);
          
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${newAttempts}/${maxReconnectAttempts})`);
          updateStatus({ reconnectAttempts: newAttempts });
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (status.reconnectAttempts >= maxReconnectAttempts) {
          const errorMsg = 'Failed to reconnect after multiple attempts';
          updateStatus({ error: errorMsg });
          toast.error(errorMsg, { id: 'ws-connection' });
        }
      };

      ws.onerror = (err) => {
        clearTimeout(connectionTimer);
        console.error('❌ WebSocket error:', err);
        const errorMsg = 'WebSocket connection error';
        updateStatus({ 
          error: errorMsg, 
          isConnecting: false 
        });
        toast.error(errorMsg, { id: 'ws-connection' });
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('❌ Error creating WebSocket:', err);
      const errorMsg = 'Failed to create WebSocket connection';
      updateStatus({ 
        error: errorMsg, 
        isConnecting: false 
      });
      toast.error(errorMsg, { id: 'ws-connection' });
    }
  }, [status.isConnecting, status.reconnectAttempts, getWebSocketUrl, updateStatus, startHeartbeat, clearTimeouts, autoReconnect, onPriceUpdate, onOrderUpdate]);

  const disconnect = useCallback(() => {
    console.log('🚪 Disconnecting WebSocket...');
    clearTimeouts();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    updateStatus({
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempts: 0
    });
  }, [clearTimeouts, updateStatus]);

  const forceReconnect = useCallback(() => {
    updateStatus({ reconnectAttempts: 0 });
    disconnect();
    setTimeout(connect, 1000);
  }, [connect, disconnect, updateStatus]);

  useEffect(() => {
    if (userId && autoReconnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId, autoReconnect, connect, disconnect]);

  return {
    ...status,
    connect,
    disconnect,
    forceReconnect,
  };
};


