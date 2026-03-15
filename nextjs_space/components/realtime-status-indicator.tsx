"use client";

import { useRealtimeContext } from "./realtime-provider";
import { Wifi, WifiOff, Users } from "lucide-react";
import { useState } from "react";

export function RealtimeStatusIndicator() {
  const { isConnected, connectedClients } = useRealtimeContext();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed bottom-20 right-6 z-40">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all duration-300 ${
          isConnected
            ? "bg-green-100 text-green-700 hover:bg-green-200"
            : "bg-red-100 text-red-700 hover:bg-red-200"
        }`}
      >
        {isConnected ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="text-xs font-medium">
          {isConnected ? "Live" : "Offline"}
        </span>
      </button>

      {showDetails && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border p-4 min-w-[200px]">
          <h4 className="font-semibold text-gray-900 mb-2">Real-time Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connection</span>
              <span className={isConnected ? "text-green-600" : "text-red-600"}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            {isConnected && connectedClients > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Team Online
                </span>
                <span className="text-blue-600 font-medium">
                  {connectedClients}
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-3 pt-2 border-t">
            Updates are pushed instantly across all connected team members.
          </p>
        </div>
      )}
    </div>
  );
}
