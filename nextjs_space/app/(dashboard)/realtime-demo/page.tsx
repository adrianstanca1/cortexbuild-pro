// app/(dashboard)/realtime-demo/page.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useSession } from "next-auth/react";
import RealTimeNotifications from "@/components/ui/realtime-notifications";

const RealTimeDemoPage = () => {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id || session?.user?.id;
  const projectId = "demo-project"; // Using a demo project ID

  const {
    isConnected,
    tasks,
    messages,
    onlineUsers,
    sendTaskUpdate,
    sendProjectMessage,
  } = useRealTimeUpdates(projectId);

  const [newMessage, setNewMessage] = React.useState("");

  const handleSendMessage = () => {
    if (newMessage.trim() && session?.user?.name) {
      sendProjectMessage(newMessage, session.user.name);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Real-Time Collaboration Demo</h1>
        <div className="flex items-center gap-4">
          <div
            className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
          />
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
          <RealTimeNotifications />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Live Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="border p-3 rounded-md">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Status: {task.status} | Priority: {task.priority}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No live task updates yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Project Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col h-96">
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {messages.length > 0 ? (
                  messages.map((msg) => (
                    <div key={msg.id} className="border-b pb-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{msg.senderName}</span>
                        <span className="text-xs text-gray-500">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No messages yet
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Online Users Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Online Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {onlineUsers.length > 0 ? (
                onlineUsers.map((user, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>User {user.id?.substring(0, 8) ?? "Unknown"}...</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No other users online</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Send Test Notification</h3>
              <Button
                onClick={() => {
                  // In a real implementation, this would send a notification
                  console.log("Sending test notification...");
                }}
                className="w-full"
              >
                Send Test Notification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          This demo shows real-time collaboration features including live task
          updates, instant messaging, and online user presence.
        </p>
        <p className="mt-2">
          Open this page in multiple browsers/tabs to see the real-time updates
          in action!
        </p>
      </div>
    </div>
  );
};

export default RealTimeDemoPage;
