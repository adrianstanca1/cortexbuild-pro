import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../../utils/logger.js';
import { getDb } from '../../database.js';
import { v4 as uuidv4 } from 'uuid';

// Types for collaboration
export interface CursorPosition {
  x: number;
  y: number;
  documentId?: string;
  pageId?: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  currentDocument?: string;
  cursorPosition?: CursorPosition;
  lastActivity: Date;
  color: string;
}

export interface DocumentEdit {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  operation: 'insert' | 'delete' | 'replace' | 'format';
  position: number;
  content?: string;
  length?: number;
  timestamp: Date;
  version: number;
}

export interface Comment {
  id: string;
  entityType: 'document' | 'task' | 'project' | 'whiteboard';
  entityId: string;
  userId: string;
  userName: string;
  content: string;
  parentId?: string;
  mentions: string[];
  position?: { x: number; y: number };
  resolved: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface WhiteboardElement {
  id: string;
  type: 'text' | 'shape' | 'line' | 'image' | 'sticky' | 'arrow';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  style?: Record<string, any>;
  createdBy: string;
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Whiteboard {
  id: string;
  projectId: string;
  name: string;
  elements: WhiteboardElement[];
  collaborators: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityEvent {
  id: string;
  companyId: string;
  projectId?: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// In-memory stores for real-time data
const userPresence = new Map<string, UserPresence>();
const documentSessions = new Map<string, Set<string>>();
const whiteboards = new Map<string, Whiteboard>();
const documentVersions = new Map<string, number>();

// Color palette for user cursors
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E'
];

let io: SocketIOServer | null = null;

export const collaborationService = {
  init(socketIo: SocketIOServer) {
    io = socketIo;
    logger.info('[Collaboration] Service initialized');
  },

  updatePresence(userId: string, presence: Partial<UserPresence>) {
    const existing = userPresence.get(userId) || {
      userId,
      userName: presence.userName || 'Unknown',
      status: 'online',
      color: this.getUserColor(userId),
      lastActivity: new Date()
    };

    const updated = { ...existing, ...presence, lastActivity: new Date() };
    userPresence.set(userId, updated);
    this.broadcastPresence(userId, updated);
    return updated;
  },

  getUserColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
  },

  removePresence(userId: string) {
    userPresence.delete(userId);
    documentSessions.forEach((users, docId) => {
      if (users.has(userId)) {
        users.delete(userId);
        this.broadcastDocumentUsers(docId);
      }
    });
  },

  broadcastPresence(userId: string, presence: UserPresence) {
    if (!io) return;
    io.to(`company:${presence.userId}`).emit('presence:update', {
      userId,
      ...presence
    });
  },

  updateCursor(userId: string, position: CursorPosition) {
    const presence = userPresence.get(userId);
    if (presence) {
      presence.cursorPosition = position;
      presence.lastActivity = new Date();
      
      if (position.documentId) {
        io?.to(`doc:${position.documentId}`).emit('cursor:update', {
          userId,
          userName: presence.userName,
          color: presence.color,
          position: { x: position.x, y: position.y },
          timestamp: new Date()
        });
      }
    }
  },

  joinDocument(userId: string, documentId: string) {
    if (!documentSessions.has(documentId)) {
      documentSessions.set(documentId, new Set());
    }
    documentSessions.get(documentId)!.add(userId);
    
    const presence = userPresence.get(userId);
    if (presence) {
      presence.currentDocument = documentId;
    }

    this.broadcastDocumentUsers(documentId);
  },

  leaveDocument(userId: string, documentId: string) {
    const users = documentSessions.get(documentId);
    if (users) {
      users.delete(userId);
      if (users.size === 0) {
        documentSessions.delete(documentId);
      }
    }

    const presence = userPresence.get(userId);
    if (presence && presence.currentDocument === documentId) {
      presence.currentDocument = undefined;
    }

    this.broadcastDocumentUsers(documentId);
  },

  broadcastDocumentUsers(documentId: string) {
    if (!io) return;
    
    const users = documentSessions.get(documentId);
    const activeUsers: UserPresence[] = [];
    
    users?.forEach(userId => {
      const presence = userPresence.get(userId);
      if (presence) {
        activeUsers.push(presence);
      }
    });

    io.to(`doc:${documentId}`).emit('document:users', {
      documentId,
      users: activeUsers,
      count: activeUsers.length
    });
  },

  async applyEdit(edit: Omit<DocumentEdit, 'id' | 'timestamp'>): Promise<DocumentEdit> {
    const fullEdit: DocumentEdit = {
      ...edit,
      id: uuidv4(),
      timestamp: new Date()
    };

    const currentVersion = documentVersions.get(edit.documentId) || 0;
    fullEdit.version = currentVersion + 1;
    documentVersions.set(edit.documentId, fullEdit.version);

    io?.to(`doc:${edit.documentId}`).except(`user:${edit.userId}`).emit('document:edit', fullEdit);

    try {
      const db = getDb();
      await db.run(
        `INSERT INTO document_edits (id, documentId, userId, operation, position, content, length, version, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullEdit.id, edit.documentId, edit.userId, edit.operation, edit.position, 
         edit.content || null, edit.length || null, fullEdit.version, fullEdit.timestamp.toISOString()]
      );
    } catch (err) {
      logger.error('[Collaboration] Failed to persist edit:', err);
    }

    return fullEdit;
  },

  async createComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const fullComment: Comment = {
      ...comment,
      id: uuidv4(),
      createdAt: new Date()
    };

    try {
      const db = getDb();
      await db.run(
        `INSERT INTO comments (id, companyId, entityType, entityId, userId, userName, content, parentId, mentions, position, resolved, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullComment.id, '', comment.entityType, comment.entityId, comment.userId, 
         comment.userName, comment.content, comment.parentId || null, 
         JSON.stringify(comment.mentions), comment.position ? JSON.stringify(comment.position) : null,
         false, fullComment.createdAt.toISOString()]
      );

      io?.to(`${comment.entityType}:${comment.entityId}`).emit('comment:created', fullComment);

      await this.logActivity({
        companyId: '',
        projectId: comment.entityType === 'project' ? comment.entityId : undefined,
        userId: comment.userId,
        userName: comment.userName,
        action: 'comment_created',
        entityType: comment.entityType,
        entityId: comment.entityId,
        metadata: { commentId: fullComment.id }
      });
    } catch (err) {
      logger.error('[Collaboration] Failed to create comment:', err);
    }

    return fullComment;
  },

  async createWhiteboard(projectId: string, name: string, createdBy: string): Promise<Whiteboard> {
    const whiteboard: Whiteboard = {
      id: uuidv4(),
      projectId,
      name,
      elements: [],
      collaborators: [createdBy],
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    whiteboards.set(whiteboard.id, whiteboard);

    try {
      const db = getDb();
      await db.run(
        `INSERT INTO whiteboards (id, projectId, name, elements, collaborators, createdBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [whiteboard.id, projectId, name, '[]', JSON.stringify([createdBy]), 
         createdBy, whiteboard.createdAt.toISOString(), whiteboard.updatedAt.toISOString()]
      );
    } catch (err) {
      logger.error('[Collaboration] Failed to create whiteboard:', err);
    }

    return whiteboard;
  },

  addWhiteboardElement(whiteboardId: string, element: Omit<WhiteboardElement, 'id' | 'createdAt' | 'updatedAt'>): WhiteboardElement | null {
    const whiteboard = whiteboards.get(whiteboardId);
    if (!whiteboard) return null;

    const fullElement: WhiteboardElement = {
      ...element,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    whiteboard.elements.push(fullElement);
    whiteboard.updatedAt = new Date();

    io?.to(`whiteboard:${whiteboardId}`).emit('whiteboard:element_added', {
      whiteboardId,
      element: fullElement
    });

    return fullElement;
  },

  updateWhiteboardElement(whiteboardId: string, elementId: string, updates: Partial<WhiteboardElement>): WhiteboardElement | null {
    const whiteboard = whiteboards.get(whiteboardId);
    if (!whiteboard) return null;

    const element = whiteboard.elements.find(e => e.id === elementId);
    if (!element) return null;

    Object.assign(element, updates, { updatedAt: new Date() });
    whiteboard.updatedAt = new Date();

    io?.to(`whiteboard:${whiteboardId}`).emit('whiteboard:element_updated', {
      whiteboardId,
      element
    });

    return element;
  },

  async logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>): Promise<ActivityEvent> {
    const fullEvent: ActivityEvent = {
      ...event,
      id: uuidv4(),
      timestamp: new Date()
    };

    try {
      const db = getDb();
      await db.run(
        `INSERT INTO activity_feed (id, companyId, projectId, userId, userName, action, entityType, entityId, metadata, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fullEvent.id, event.companyId, event.projectId || null, event.userId, 
         event.userName, event.action, event.entityType, event.entityId,
         event.metadata ? JSON.stringify(event.metadata) : null, 
         fullEvent.timestamp.toISOString()]
      );

      if (event.projectId) {
        io?.to(`project:${event.projectId}`).emit('activity:new', fullEvent);
      }
      io?.to(`company:${event.companyId}`).emit('activity:new', fullEvent);
    } catch (err) {
      logger.error('[Collaboration] Failed to log activity:', err);
    }

    return fullEvent;
  },

  async getRecentActivity(companyId: string, limit: number = 50): Promise<ActivityEvent[]> {
    try {
      const db = getDb();
      const activities = await db.all(
        `SELECT * FROM activity_feed 
         WHERE companyId = ? 
         ORDER BY createdAt DESC 
         LIMIT ?`,
        [companyId, limit]
      );
      return activities.map((a: any) => ({
        ...a,
        metadata: a.metadata ? JSON.parse(a.metadata) : undefined,
        timestamp: new Date(a.createdAt)
      }));
    } catch (err) {
      logger.error('[Collaboration] Failed to get activity:', err);
      return [];
    }
  },

  getOnlineUsers(companyId: string): UserPresence[] {
    const online: UserPresence[] = [];
    userPresence.forEach((presence, userId) => {
      if (presence.status !== 'offline') {
        online.push(presence);
      }
    });
    return online;
  },

  getDocumentCollaborators(documentId: string): UserPresence[] {
    const users = documentSessions.get(documentId);
    const collaborators: UserPresence[] = [];
    
    users?.forEach(userId => {
      const presence = userPresence.get(userId);
      if (presence) {
        collaborators.push(presence);
      }
    });

    return collaborators;
  }
};

export default collaborationService;
