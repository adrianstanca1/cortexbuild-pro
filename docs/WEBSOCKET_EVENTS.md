# WebSocket Real-Time Events Documentation

## Overview

CortexBuild Pro uses Socket.IO for real-time bidirectional communication between the server and clients. The WebSocket server runs on the `/live` path and supports both polling and WebSocket transports.

## Connection

### Client Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('https://api.cortexbuildpro.com', {
    path: '/live',
    auth: {
        token: 'your-jwt-token'
    },
    transports: ['polling', 'websocket']
});
```

### Authentication

All WebSocket connections must be authenticated with a valid JWT token. The token can be provided in either:
- `auth.token` option
- `query.token` query parameter

The server supports:
1. Standard JWT tokens
2. Impersonation tokens (format: `imp_v1:targetId:timestamp:signature`)

## Connection Events

### `connect`

Emitted when the client successfully connects to the server.

```javascript
socket.on('connect', () => {
    console.log('Connected to server');
});
```

### `disconnect`

Emitted when the client disconnects from the server.

```javascript
socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
});
```

### `connect_error`

Emitted when a connection error occurs.

```javascript
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});
```

## Room Management

### Joining Rooms

Clients are automatically joined to rooms based on their authentication:

- **User Room**: `user:{userId}` - For user-specific messages
- **Company Room**: `company:{companyId}` - For company-wide broadcasts
- **Project Room**: `project:{projectId}` - For project-specific updates
- **Superadmin Room**: `superadmins` - For superadmin-only broadcasts

### Joining a Project

```javascript
socket.emit('join_project', { projectId: 'project-123' });
```

When a user joins a project, they receive updates related to that project.

## Message Events

### Receiving Messages

All real-time messages from the server are emitted via the `message` event with different `type` values.

```javascript
socket.on('message', (data) => {
    switch (data.type) {
        case 'project_updated':
            // Handle project update
            break;
        case 'task_updated':
            // Handle task update
            break;
        case 'company_presence':
            // Handle presence update
            break;
        // ... other types
    }
});
```

### Message Types

#### `company_presence`

Broadcast when users in a company connect or disconnect.

```json
{
    "type": "company_presence",
    "users": ["user1", "user2", "user3"],
    "count": 3,
    "timestamp": "2024-01-25T12:00:00.000Z"
}
```

#### `presence_update`

Broadcast when a user's presence changes within a project.

```json
{
    "type": "presence_update",
    "userId": "user123",
    "status": "online",
    "timestamp": "2024-01-25T12:00:00.000Z"
}
```

#### `project_updated`

Broadcast when a project is updated.

```json
{
    "type": "project_updated",
    "entityType": "project",
    "entityId": "project123",
    "companyId": "company456",
    "payload": {
        "id": "project123",
        "name": "Updated Project Name",
        "status": "in_progress"
    },
    "timestamp": "2024-01-25T12:00:00.000Z"
}
```

#### `task_updated`

Broadcast when a task is updated.

```json
{
    "type": "task_updated",
    "entityType": "task",
    "entityId": "task123",
    "projectId": "project456",
    "payload": {
        "id": "task123",
        "title": "Updated Task",
        "status": "completed",
        "assigneeId": "user789"
    },
    "timestamp": "2024-01-25T12:00:00.000Z"
}
```

#### `task_created`

Broadcast when a new task is created.

```json
{
    "type": "task_created",
    "entityType": "task",
    "entityId": "task123",
    "projectId": "project456",
    "payload": {
        "id": "task123",
        "title": "New Task",
        "status": "pending"
    },
    "timestamp": "2024-01-25T12:00:00.000Z"
}
```

#### `task_deleted`

Broadcast when a task is deleted.

```json
{
    "type": "task_deleted",
    "entityType": "task",
    "entityId": "task123",
    "projectId": "project456",
    "timestamp": "2024-01-25T12:00:00.000Z"
}
```

#### `notification`

Broadcast when a notification is created for a user.

```json
{
    "type": "notification",
    "userId": "user123",
    "payload": {
        "id": "notif123",
        "title": "New Assignment",
        "message": "You have been assigned to a new task",
        "priority": "high",
        "read": false
    },
    "timestamp": "2024-01-25T12:00:00.000Z"
}
```

#### `system_alert`

Broadcast system-wide alerts (maintenance, updates, etc).

```json
{
    "type": "system_alert",
    "message": "System maintenance scheduled",
    "severity": "info",
    "timestamp": "2024-01-25T12:00:00.000Z"
}
```

#### `chat_typing`

Broadcast when a user is typing in a project chat.

```json
{
    "type": "chat_typing",
    "userId": "user123",
    "userName": "John Doe",
    "projectId": "project456",
    "timestamp": "2024-01-25T12:00:00.000Z"
}
```

## Client-to-Server Events

### Sending Messages

```javascript
socket.emit('message', {
    type: 'chat_typing',
    projectId: 'project123'
});
```

### Heartbeat

Send heartbeat to maintain connection health.

```javascript
socket.emit('heartbeat');
```

The server will respond with `heartbeat_ack`.

```javascript
socket.on('heartbeat_ack', () => {
    console.log('Heartbeat acknowledged');
});
```

### Activity Monitoring

#### Subscribe to Activity Metrics

```javascript
socket.emit('activity:subscribe');
```

#### Receive Activity Metrics

```javascript
socket.on('activity:metrics', (metrics) => {
    console.log('Activity metrics:', metrics);
    // {
    //   activeUsers: 10,
    //   totalSessions: 15,
    //   apiRequestsPerMinute: 120,
    //   errorRate: 0.5,
    //   companiesOnline: 5
    // }
});
```

#### Unsubscribe from Activity Metrics

```javascript
socket.emit('activity:unsubscribe');
```

## Message Queue

The server implements a message queue system for offline users. When a message is sent to an offline user:

1. The message is queued in memory
2. When the user reconnects, queued messages are automatically flushed
3. Messages older than 24 hours are automatically cleaned up
4. Maximum queue size per user: 1000 messages

### Queued Message Format

Queued messages include additional metadata:

```json
{
    "type": "task_updated",
    "payload": { ... },
    "queued": true,
    "queuedAt": "2024-01-25T12:00:00.000Z",
    "timestamp": "2024-01-25T12:00:00.000Z"
}
```

## Connection Health

### Heartbeat Monitoring

The server monitors connection health via heartbeats:

- Clients should send heartbeat every 30 seconds
- Connections without heartbeat for 60 seconds are considered stale
- Stale connections are automatically disconnected

### Reconnection

Socket.IO automatically handles reconnection with exponential backoff:

```javascript
const socket = io('https://api.cortexbuildpro.com', {
    path: '/live',
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
});
```

## Error Handling

### Error Event

```javascript
socket.on('error', (error) => {
    console.error('Socket error:', error);
});
```

### Connection Timeout

```javascript
socket.on('connect_timeout', () => {
    console.error('Connection timeout');
});
```

## Broadcasting from Server

### To Specific User

```javascript
import { broadcastToUser } from './socket.js';

broadcastToUser('user123', {
    type: 'notification',
    payload: { ... }
});
```

### To Company

```javascript
import { broadcastToCompany } from './socket.js';

broadcastToCompany('company456', {
    type: 'project_updated',
    payload: { ... }
}, 'user123'); // Optional: exclude specific user
```

### To Project

```javascript
import { broadcastToProject } from './socket.js';

broadcastToProject('project789', {
    event: 'message',
    data: {
        type: 'task_created',
        payload: { ... }
    }
});
```

### To All Users

```javascript
import { broadcastToAll } from './socket.js';

broadcastToAll({
    type: 'system_alert',
    message: 'System maintenance in 10 minutes'
});
```

### To Superadmins Only

```javascript
import { broadcastToSuperAdmins } from './socket.js';

broadcastToSuperAdmins({
    type: 'admin_alert',
    message: 'New company registered'
});
```

## Best Practices

1. **Always authenticate**: Never send sensitive data without proper authentication
2. **Use rooms wisely**: Join only necessary rooms to reduce server load
3. **Handle disconnections**: Implement reconnection logic in your client
4. **Send heartbeats**: Send periodic heartbeats to maintain connection health
5. **Validate messages**: Always validate incoming messages on the client
6. **Handle errors gracefully**: Implement proper error handling for all events
7. **Clean up**: Remove event listeners when components unmount
8. **Throttle updates**: Avoid sending too many updates in quick succession

## Security Considerations

- All connections require valid JWT authentication
- Messages are filtered by user permissions and company membership
- Impersonation tokens have expiration and signature validation
- Session IP locking can be enabled for additional security
- Rate limiting is applied to prevent abuse

## Monitoring

WebSocket connection statistics are available via the status endpoint:

```
GET /api/v1/status/websocket
Authorization: Bearer {token}
```

Response:
```json
{
    "success": true,
    "data": {
        "connections": {
            "activeConnections": 10,
            "totalConnections": 100,
            "messagesReceived": 5000,
            "messagesSent": 4800,
            "errors": 5
        },
        "messageQueue": {
            "usersWithQueuedMessages": 2,
            "totalQueuedMessages": 15
        },
        "heartbeat": {
            "totalConnections": 10
        }
    }
}
```

## Troubleshooting

### Connection Issues

1. **Verify token**: Ensure JWT token is valid and not expired
2. **Check CORS**: Verify CORS configuration allows your origin
3. **Network issues**: Check firewall and network connectivity
4. **Server status**: Check server health at `/api/health`

### Message Not Received

1. **Verify room membership**: Ensure user is in the correct room
2. **Check permissions**: Verify user has permission to receive the message
3. **Inspect queue**: Check if messages are being queued
4. **Monitor heartbeat**: Ensure connection is healthy

### Performance Issues

1. **Reduce room subscriptions**: Only join necessary rooms
2. **Implement message filtering**: Filter messages on client side
3. **Use throttling**: Throttle frequent updates
4. **Monitor connection stats**: Check for connection bottlenecks
