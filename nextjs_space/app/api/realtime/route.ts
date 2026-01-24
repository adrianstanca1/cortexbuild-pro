export const dynamic = "force-dynamic";
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { addClient, removeClient, getOrganizationClientCount } from '@/lib/realtime-clients';

/**
 * Establishes a Server-Sent Events connection for the authenticated user and organization.
 *
 * Validates the server session, registers the client for real-time updates, and returns
 * an SSE stream that immediately emits a connected message and a system synchronization
 * payload, maintains the connection with periodic heartbeats, and removes the client on disconnect.
 *
 * @param request - The incoming Next.js request whose abort signal is used to detect client disconnection
 * @returns An HTTP Response streaming Server-Sent Events (`text/event-stream`) that emits connection, sync, and heartbeat messages and cleans up on disconnect
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const organizationId = (session.user as { organizationId?: string }).organizationId || '';

  const stream = new ReadableStream({
    start(controller) {
      addClient(userId, controller, organizationId);

      // Send initial connection message with org context
      const connectedClients = getOrganizationClientCount(organizationId);
      const data = JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        payload: {
          userId,
          organizationId,
          connectedClients
        }
      });
      controller.enqueue(`data: ${data}\n\n`);

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`: heartbeat\n\n`);
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup on close
      // Create a recurring keep-alive to prevent Nginx timeouts
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(': heartbeat\n\n');
        } catch (e) {
          clearInterval(heartbeatInterval);
        }
      }, 25000);

      // Initial client synchronization
      const initialPayload = JSON.stringify({
        type: 'system_sync',
        data: { connectedClients: getOrganizationClientCount(organizationId) },
        timestamp: new Date().toISOString()
      });

      controller.enqueue(`data: ${initialPayload}\n\n`);

      // Handle client disconnection
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat); // Clear the original heartbeat
        clearInterval(heartbeatInterval); // Clear the new heartbeat
        removeClient(userId);
        console.log(`SSE Client decoupled. User: ${userId}, Org: ${organizationId}. Active clients for org: ${getOrganizationClientCount(organizationId)}`);
      });
    },
    cancel() {
      removeClient(userId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}