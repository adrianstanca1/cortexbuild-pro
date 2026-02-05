// app/(dashboard)/realtime-demo/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRealtimeContext, useRealtimeSubscription } from '@/components/realtime-provider';
import { useSession } from 'next-auth/react';
import RealTimeNotifications from '@/components/ui/realtime-notifications';
import { toast } from 'sonner';
import type { RealtimeEvent } from '@/lib/realtime';

interface Task {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
}

const RealTimeDemoPage = () => {
  const { data: session } = useSession();
  const { isConnected, connectedClients } = useRealtimeContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [eventCount, setEventCount] = useState(0);

  // Subscribe to task updates
  useRealtimeSubscription(['task_created', 'task_updated', 'task_deleted'], (event: RealtimeEvent) => {
    setEventCount(prev => prev + 1);
    const payload = event.payload as any;
    
    if (event.type === 'task_created' || event.type === 'task_updated') {
      setTasks(prev => {
        const existingIndex = prev.findIndex(t => t.id === payload.id);
        const task: Task = {
          id: payload.id,
          title: payload.title,
          description: payload.description,
          status: payload.status,
          priority: payload.priority,
        };
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = task;
          return updated;
        }
        return [...prev, task];
      });
    } else if (event.type === 'task_deleted') {
      setTasks(prev => prev.filter(t => t.id !== payload.id));
    }
  });

  const handleSendNotification = () => {
    toast.success('Test notification sent!', {
      description: 'This demonstrates the notification system',
      duration: 5000,
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Real-Time Collaboration Demo</h1>
        <div className="flex items-center gap-4">
          <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          <span className="text-sm text-gray-600">({connectedClients} clients)</span>
          <RealTimeNotifications />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Live Task Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Real-time events received: <span className="font-bold">{eventCount}</span>
              </p>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="border p-3 rounded-md bg-gray-50">
                    <h3 className="font-medium">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="mt-2 flex gap-2">
                      {task.status && (
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {task.status}
                        </span>
                      )}
                      {task.priority && (
                        <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                          {task.priority}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No live task updates yet</p>
                  <p className="text-sm mt-2">Create or update a task in any project to see updates here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo Actions Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Connection Status</h3>
              <div className="p-4 border rounded-md bg-gray-50">
                <div className="flex items-center justify-between">
                  <span>Server Connection:</span>
                  <span className={`font-bold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span>Connected Clients:</span>
                  <span className="font-bold">{connectedClients}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Send Test Notification</h3>
              <Button 
                onClick={handleSendNotification}
                className="w-full"
                disabled={!isConnected}
              >
                Send Test Notification
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Sends a test notification to demonstrate the notification system
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">How It Works</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>✓ This page uses Server-Sent Events (SSE) to receive real-time updates</p>
                <p>✓ Any task created, updated, or deleted will appear here instantly</p>
                <p>✓ Multiple users can view updates simultaneously</p>
                <p>✓ Automatic reconnection on connection loss</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>About This Demo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <p>This demo showcases the real-time collaboration features of CortexBuild Pro:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Live task updates across all connected clients</li>
            <li>Server-Sent Events (SSE) for efficient real-time communication</li>
            <li>Automatic reconnection with exponential backoff</li>
            <li>Toast notifications for important events</li>
            <li>Connection status monitoring</li>
          </ul>
          <p className="mt-4 font-medium">Try it out:</p>
          <p className="mt-1">Open this page in multiple browsers or tabs, then create or update a task in any project to see the updates appear here in real-time!</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeDemoPage;