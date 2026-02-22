// Store connected SSE clients with organization info
interface ClientInfo {
  controller: ReadableStreamDefaultController;
  organizationId: string;
}

const clients = new Map<string, ClientInfo>();

export function addClient(userId: string, controller: ReadableStreamDefaultController, organizationId: string) {
  clients.set(userId, { controller, organizationId });
}

export function removeClient(userId: string) {
  clients.delete(userId);
}

export function getClient(userId: string): ClientInfo | undefined {
  return clients.get(userId);
}

// Helper to broadcast events to specific users
export function broadcastEvent(userIds: string[], event: object) {
  const data = JSON.stringify(event);
  userIds.forEach(userId => {
    const clientInfo = clients.get(userId);
    if (clientInfo) {
      try {
        clientInfo.controller.enqueue(`data: ${data}\n\n`);
      } catch {
        clients.delete(userId);
      }
    }
  });
}

// Broadcast to all connected clients in an organization
export function broadcastToOrganization(organizationId: string, event: object) {
  const data = JSON.stringify(event);
  clients.forEach((clientInfo, userId) => {
    if (clientInfo.organizationId === organizationId) {
      try {
        clientInfo.controller.enqueue(`data: ${data}\n\n`);
      } catch {
        clients.delete(userId);
      }
    }
  });
}

// Broadcast to all connected clients (use sparingly - prefer organization-scoped)
export function broadcastToAll(event: object) {
  const data = JSON.stringify(event);
  clients.forEach((clientInfo, userId) => {
    try {
      clientInfo.controller.enqueue(`data: ${data}\n\n`);
    } catch {
      clients.delete(userId);
    }
  });
}

// Broadcast to project team members
export function broadcastToProjectTeam(userIds: string[], event: object) {
  broadcastEvent(userIds, event);
}

// Get count of connected clients
export function getClientCount(): number {
  return clients.size;
}

// Get count of connected clients in an organization
export function getOrganizationClientCount(organizationId: string): number {
  let count = 0;
  clients.forEach((clientInfo) => {
    if (clientInfo.organizationId === organizationId) {
      count++;
    }
  });
  return count;
}
