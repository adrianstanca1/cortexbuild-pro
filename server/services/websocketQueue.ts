/**
 * Enhanced WebSocket Service with Message Queue and Reconnection
 */

import { io, Socket } from 'socket.io-client';
import { logger } from '../utils/logger.js';

interface QueuedMessage {
    userId: string;
    message: any;
    timestamp: Date;
    attempts: number;
}

interface RealtimeMessage {
    type: string;
    payload?: any;
    entityType?: string;
    entityId?: string;
    companyId?: string;
    userId?: string;
    projectId?: string;
    timestamp: string;
}

export class WebSocketMessageQueue {
    private queue: Map<string, QueuedMessage[]> = new Map();
    private maxQueueSize = 1000;
    private maxRetries = 3;
    private io: any = null;

    public setSocketIO(io: any) {
        this.io = io;
    }

    /**
     * Queue a message for offline user
     */
    public queueMessage(userId: string, message: any): void {
        const userQueue = this.queue.get(userId) || [];

        // Check queue size limit
        if (userQueue.length >= this.maxQueueSize) {
            logger.warn(`Message queue for user ${userId} is full, dropping oldest message`);
            userQueue.shift(); // Remove oldest message
        }

        userQueue.push({
            userId,
            message,
            timestamp: new Date(),
            attempts: 0,
        });

        this.queue.set(userId, userQueue);
        logger.debug(`Queued message for offline user ${userId}, queue size: ${userQueue.length}`);
    }

    /**
     * Flush queued messages when user reconnects
     */
    public async flushQueue(userId: string, socketId: string): Promise<void> {
        const userQueue = this.queue.get(userId);
        if (!userQueue || userQueue.length === 0) {
            return;
        }

        logger.info(`Flushing ${userQueue.length} queued messages for user ${userId}`);

        const socket = this.io?.sockets.sockets.get(socketId);
        if (!socket) {
            logger.warn(`Socket ${socketId} not found for user ${userId}`);
            return;
        }

        // Send all queued messages
        for (const queuedMsg of userQueue) {
            try {
                socket.emit('message', {
                    ...queuedMsg.message,
                    queued: true,
                    queuedAt: queuedMsg.timestamp,
                });
                logger.debug(`Sent queued message to user ${userId}`);
            } catch (error) {
                logger.error(`Failed to send queued message to user ${userId}:`, error);
                queuedMsg.attempts++;
                
                // If max retries reached, drop the message
                if (queuedMsg.attempts >= this.maxRetries) {
                    logger.warn(`Dropping message for user ${userId} after ${this.maxRetries} attempts`);
                }
            }
        }

        // Clear the queue
        this.queue.delete(userId);
        logger.info(`Cleared message queue for user ${userId}`);
    }

    /**
     * Get queue statistics
     */
    public getStats() {
        const totalMessages = Array.from(this.queue.values()).reduce(
            (sum, queue) => sum + queue.length,
            0
        );
        return {
            usersWithQueuedMessages: this.queue.size,
            totalQueuedMessages: totalMessages,
            queuesByUser: Array.from(this.queue.entries()).map(([userId, messages]) => ({
                userId,
                messageCount: messages.length,
            })),
        };
    }

    /**
     * Clean up old messages (older than 24 hours)
     */
    public cleanupOldMessages(): void {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        for (const [userId, queue] of this.queue.entries()) {
            const filteredQueue = queue.filter((msg) => msg.timestamp > oneDayAgo);

            if (filteredQueue.length === 0) {
                this.queue.delete(userId);
            } else if (filteredQueue.length < queue.length) {
                this.queue.set(userId, filteredQueue);
                logger.info(
                    `Cleaned up ${queue.length - filteredQueue.length} old messages for user ${userId}`
                );
            }
        }
    }
}

export class WebSocketHeartbeat {
    private heartbeatInterval?: NodeJS.Timeout;
    private clientHeartbeats: Map<string, Date> = new Map();
    private heartbeatTimeout = 60000; // 60 seconds
    private io: any = null;

    public setSocketIO(io: any) {
        this.io = io;
    }

    /**
     * Start heartbeat monitoring
     */
    public start(): void {
        // Check heartbeats every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            this.checkHeartbeats();
        }, 30000);

        logger.info('WebSocket heartbeat monitoring started');
    }

    /**
     * Record heartbeat from client
     */
    public recordHeartbeat(socketId: string): void {
        this.clientHeartbeats.set(socketId, new Date());
    }

    /**
     * Check for stale connections
     */
    private checkHeartbeats(): void {
        const now = Date.now();
        const staleConnections: string[] = [];

        for (const [socketId, lastHeartbeat] of this.clientHeartbeats.entries()) {
            const timeSinceLastHeartbeat = now - lastHeartbeat.getTime();

            if (timeSinceLastHeartbeat > this.heartbeatTimeout) {
                staleConnections.push(socketId);
            }
        }

        // Disconnect stale connections
        for (const socketId of staleConnections) {
            const socket = this.io?.sockets.sockets.get(socketId);
            if (socket) {
                logger.warn(`Disconnecting stale connection: ${socketId}`);
                socket.disconnect(true);
            }
            this.clientHeartbeats.delete(socketId);
        }
    }

    /**
     * Remove heartbeat tracking on disconnect
     */
    public removeClient(socketId: string): void {
        this.clientHeartbeats.delete(socketId);
    }

    /**
     * Stop heartbeat monitoring
     */
    public stop(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.clientHeartbeats.clear();
    }

    /**
     * Get heartbeat statistics
     */
    public getStats() {
        const now = Date.now();
        const connections = Array.from(this.clientHeartbeats.entries()).map(
            ([socketId, lastHeartbeat]) => ({
                socketId,
                lastHeartbeat: lastHeartbeat.toISOString(),
                timeSinceLastHeartbeat: now - lastHeartbeat.getTime(),
            })
        );

        return {
            totalConnections: this.clientHeartbeats.size,
            connections,
        };
    }
}

// Export singleton instances
export const messageQueue = new WebSocketMessageQueue();
export const heartbeatMonitor = new WebSocketHeartbeat();

// Cleanup interval - run every hour
setInterval(() => {
    messageQueue.cleanupOldMessages();
}, 60 * 60 * 1000);
