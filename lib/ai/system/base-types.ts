export enum MessageType {
  TASK = 'task',
  RESULT = 'result',
  QUERY = 'query',
  RESPONSE = 'response',
  EVENT = 'event',
  COMMAND = 'command',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}

export interface BaseMessage {
  id: string;
  timestamp: Date;
  senderId: string;
  recipientId?: string;
  type: MessageType;
  content: any;
  metadata?: Record<string, any>;
}

export interface MessageHandler {
  canHandle(message: BaseMessage): boolean;
  handle(message: BaseMessage): Promise<any>;
}
