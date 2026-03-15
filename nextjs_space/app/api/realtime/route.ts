import { NextRequest } from "next/server";

// Force dynamic rendering
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import {
  addClient,
  removeClient,
  getOrganizationClientCount,
} from "@/lib/realtime-clients";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const organizationId =
    (session.user as { organizationId?: string }).organizationId || "";

  const stream = new ReadableStream({
    start(controller) {
      addClient(userId, controller, organizationId);

      // Send initial connection message with org context
      const connectedClients = getOrganizationClientCount(organizationId);
      const data = JSON.stringify({
        type: "connected",
        timestamp: new Date().toISOString(),
        payload: {
          userId,
          organizationId,
          connectedClients,
        },
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
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeClient(userId);
      });
    },
    cancel() {
      removeClient(userId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
