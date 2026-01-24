import { NextApiRequest, NextApiResponse } from 'next';
import { createServer } from 'http';
import { websocketService } from '@/server/websocket';

// This API route serves as an upgrade handler for WebSocket connections
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Upgrade the Next.js API route to a WebSocket server
  const server = createServer();
  
  // Initialize WebSocket service
  await websocketService.initialize(server);
  
  // Upgrade the request to WebSocket
  server.on('upgrade', (request, socket, head) => {
    // The WebSocket server is already set up to handle authentication
    // Pass the upgrade request to the WebSocket server
    websocketService['wss']?.handleUpgrade(request, socket, head, (ws) => {
      websocketService['wss']?.emit('connection', ws, request);
    });
  });

  // Handle the request
  server.emit('request', req, res);

  // Prevent Next.js from ending the response
  res.socket.server.on('upgrade', () => {});
}

export const config = {
  api: {
    bodyParser: false,
  },
};