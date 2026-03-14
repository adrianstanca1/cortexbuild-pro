-- Collaboration Feature Tables Migration
-- Run this to add tables for real-time collaboration features

-- Document edits for real-time editing
CREATE TABLE IF NOT EXISTS document_edits (
  id VARCHAR(255) PRIMARY KEY,
  documentId VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL, -- insert, delete, replace, format
  position INTEGER NOT NULL,
  content TEXT,
  length INTEGER,
  version INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  INDEX idx_document_edits_document (documentId),
  INDEX idx_document_edits_version (documentId, version)
);

-- Whiteboards for collaborative whiteboard feature
CREATE TABLE IF NOT EXISTS whiteboards (
  id VARCHAR(255) PRIMARY KEY,
  projectId VARCHAR(255) NOT NULL,
  name VARCHAR(500) NOT NULL,
  elements TEXT NOT NULL, -- JSON array of whiteboard elements
  collaborators TEXT NOT NULL, -- JSON array of user IDs
  createdBy VARCHAR(255) NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  INDEX idx_whiteboards_project (projectId),
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);

-- Document sessions for tracking active editors
CREATE TABLE IF NOT EXISTS document_sessions (
  id VARCHAR(255) PRIMARY KEY,
  documentId VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  userName VARCHAR(255),
  userColor VARCHAR(50),
  joinedAt TEXT NOT NULL,
  lastActivity TEXT NOT NULL,
  cursorPosition TEXT, -- JSON {x, y}
  UNIQUE KEY unique_user_doc (documentId, userId),
  INDEX idx_doc_sessions_document (documentId),
  INDEX idx_doc_sessions_user (userId)
);

-- Enhanced comments table with annotations support
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  entityType VARCHAR(50) NOT NULL, -- document, task, project, whiteboard
  entityId VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  userName VARCHAR(255),
  content TEXT NOT NULL,
  parentId VARCHAR(255),
  mentions TEXT, -- JSON array of user IDs
  position TEXT, -- JSON {x, y} for annotations
  resolved BOOLEAN DEFAULT FALSE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT,
  INDEX idx_comments_entity (entityType, entityId),
  INDEX idx_comments_company (companyId),
  INDEX idx_comments_user (userId),
  INDEX idx_comments_parent (parentId),
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

-- Activity feed table
CREATE TABLE IF NOT EXISTS activity_feed (
  id VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  projectId VARCHAR(255),
  userId VARCHAR(255) NOT NULL,
  userName VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entityType VARCHAR(50) NOT NULL,
  entityId VARCHAR(255) NOT NULL,
  metadata TEXT, -- JSON
  createdAt TEXT NOT NULL,
  INDEX idx_activity_company (companyId),
  INDEX idx_activity_project (projectId),
  INDEX idx_activity_user (userId),
  INDEX idx_activity_created (createdAt),
  FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
);

-- User presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
  userId VARCHAR(255) PRIMARY KEY,
  companyId VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'offline', -- online, away, busy, offline
  currentDocument VARCHAR(255),
  lastActivity TEXT NOT NULL,
  color VARCHAR(50),
  INDEX idx_presence_company (companyId),
  INDEX idx_presence_status (status),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Cursor positions for live tracking
CREATE TABLE IF NOT EXISTS cursor_positions (
  id VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  documentId VARCHAR(255) NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE KEY unique_cursor (userId, documentId),
  INDEX idx_cursor_document (documentId),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Collaboration rooms for grouping users
CREATE TABLE IF NOT EXISTS collaboration_rooms (
  id VARCHAR(255) PRIMARY KEY,
  projectId VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- document, whiteboard, general
  entityId VARCHAR(255), -- ID of document/whiteboard if applicable
  createdBy VARCHAR(255) NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  INDEX idx_rooms_project (projectId),
  INDEX idx_rooms_type (type),
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
);

-- Room participants
CREATE TABLE IF NOT EXISTS room_participants (
  roomId VARCHAR(255) NOT NULL,
  userId VARCHAR(255) NOT NULL,
  joinedAt TEXT NOT NULL,
  lastActivity TEXT NOT NULL,
  PRIMARY KEY (roomId, userId),
  FOREIGN KEY (roomId) REFERENCES collaboration_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Notification preferences for collaboration events
CREATE TABLE IF NOT EXISTS collaboration_preferences (
  userId VARCHAR(255) PRIMARY KEY,
  emailOnMention BOOLEAN DEFAULT TRUE,
  emailOnComment BOOLEAN DEFAULT TRUE,
  emailOnEdit BOOLEAN DEFAULT FALSE,
  pushOnMention BOOLEAN DEFAULT TRUE,
  pushOnComment BOOLEAN DEFAULT TRUE,
  showCursors BOOLEAN DEFAULT TRUE,
  showPresence BOOLEAN DEFAULT TRUE,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
