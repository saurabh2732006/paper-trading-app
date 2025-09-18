
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { priceEngine } from '@/services/priceEngine';
import { matchingEngine } from '@/services/matchingEngine';
import { PriceTick, OrderUpdate } from '@/types';
import logger from '@/utils/logger';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  isAlive?: boolean;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<number, Set<AuthenticatedWebSocket>> = new Map();

  constructor(server: any) {
    try {
      this.wss = new WebSocketServer({ 
        server,
        path: '/ws/prices',
        clientTracking: true,
        maxPayload: 16 * 1024, // 16KB max payload
      });

      this.setupWebSocketServer();
      this.setupPriceEngineListener();
      this.setupMatchingEngineListener();
      this.setupHeartbeat();
      
      logger.info('✅ WebSocket server initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, req: IncomingMessage) => {
      logger.info('🔗 New WebSocket connection from:', req.socket.remoteAddress);

      ws.isAlive = true;

      // Simple authentication via query parameter (for demo purposes)
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId');

      if (userId) {
        const parsedUserId = parseInt(userId, 10);
        if (!isNaN(parsedUserId) && parsedUserId > 0) {
          ws.userId = parsedUserId;
          this.addClient(ws.userId, ws);
          logger.info(`✅ WebSocket client authenticated as user ${ws.userId}`);
          
          // Send welcome message
          this.sendToClient(ws, {
            type: 'connected',
            data: {
              message: 'Successfully connected to real-time updates',
              userId: ws.userId,
              timestamp: new Date().toISOString()
            }
          });
        } else {
          logger.warn('⚠️ Invalid userId in WebSocket connection, closing connection');
          ws.close(1008, 'Invalid userId');
          return;
        }
      } else {
        logger.warn('⚠️ No userId provided in WebSocket connection');
      }

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          logger.info('Received WebSocket message:', message);
          // Handle client messages if needed
        } catch (error) {
          logger.error('Invalid WebSocket message format:', error);
        }
      });

      ws.on('close', (code, reason) => {
        if (ws.userId) {
          this.removeClient(ws.userId, ws);
          logger.info(`🚪 WebSocket client disconnected for user ${ws.userId}, code: ${code}, reason: ${reason}`);
        }
      });

      ws.on('error', (error) => {
        logger.error('❌ WebSocket error for user', ws.userId, ':', error);
        if (ws.userId) {
          this.removeClient(ws.userId, ws);
        }
      });
    });

    this.wss.on('error', (error) => {
      logger.error('❌ WebSocket Server error:', error);
    });
  }

  private setupPriceEngineListener(): void {
    priceEngine.on('priceUpdate', (ticks: PriceTick[]) => {
      this.broadcastToAll({
        type: 'priceUpdate',
        data: ticks,
      });
    });
  }

  private setupMatchingEngineListener(): void {
    matchingEngine.on('orderUpdate', (orderUpdate: OrderUpdate) => {
      // Broadcast order update to the specific user
      this.broadcastToUser(orderUpdate.orderId, {
        type: 'orderUpdate',
        data: orderUpdate,
      });
    });
  }

  private setupHeartbeat(): void {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  private addClient(userId: number, ws: AuthenticatedWebSocket): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(ws);
  }

  private removeClient(userId: number, ws: AuthenticatedWebSocket): void {
    const userClients = this.clients.get(userId);
    if (userClients) {
      userClients.delete(ws);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: any): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      logger.error('Failed to send message to WebSocket client:', error);
    }
  }

  private broadcastToAll(message: any): void {
    const data = JSON.stringify(message);
    let successCount = 0;
    let failCount = 0;
    
    this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
          successCount++;
        } else {
          // Clean up dead connections
          if (ws.userId) {
            this.removeClient(ws.userId, ws);
          }
        }
      } catch (error) {
        failCount++;
        logger.error('Failed to broadcast to WebSocket client:', error);
        if (ws.userId) {
          this.removeClient(ws.userId, ws);
        }
      }
    });
    
    if (failCount > 0) {
      logger.warn(`⚠️ Broadcast partially failed: ${successCount} success, ${failCount} failed`);
    }
  }

  private broadcastToUser(userId: number, message: any): void {
    const data = JSON.stringify(message);
    const userClients = this.clients.get(userId);
    
    if (userClients) {
      userClients.forEach((ws: AuthenticatedWebSocket) => {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          } else {
            // Clean up dead connection
            this.removeClient(userId, ws);
          }
        } catch (error) {
          logger.error(`Failed to send message to user ${userId}:`, error);
          this.removeClient(userId, ws);
        }
      });
    }
  }

  public getConnectedClientsCount(): number {
    return this.wss.clients.size;
  }

  public getConnectedUsersCount(): number {
    return this.clients.size;
  }
}

