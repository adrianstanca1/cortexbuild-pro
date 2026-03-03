import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Database, 
  Wifi, 
  WifiOff, 
  Activity, 
  Clock, 
  Server, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import backendApi from '../../services/backendApi';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
  database: {
    status: string;
    tables: number;
    total_records: number;
  };
  memory: {
    used: string;
    total: string;
    percentage: number;
  };
  services: {
    api: string;
    websocket: string;
    database: string;
  };
}

export default function BackendStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Check backend health
  const checkHealth = async () => {
    try {
      setStatus('checking');
      const health = await backendApi.getHealthCheck();
      setHealthData(health);
      setStatus('connected');
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
      setStatus('disconnected');
      setHealthData(null);
      setLastCheck(new Date());
    }
  };

  // Monitor WebSocket status
  useEffect(() => {
    const checkWsStatus = () => {
      const ws = backendApi.getWebSocketStatus();
      setWsStatus(ws.connected ? 'connected' : 'disconnected');
    };

    // Initial check
    checkWsStatus();

    // Set up interval to check WebSocket status
    const wsInterval = setInterval(checkWsStatus, 2000);

    return () => clearInterval(wsInterval);
  }, []);

  // Periodic health checks
  useEffect(() => {
    // Initial check
    checkHealth();

    // Set up interval for health checks
    const healthInterval = setInterval(checkHealth, 30000); // Every 30 seconds

    return () => clearInterval(healthInterval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
      case 'running':
        return 'text-green-500';
      case 'disconnected':
      case 'error':
        return 'text-red-500';
      case 'checking':
      case 'connecting':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
      case 'running':
        return <CheckCircle className="h-4 w-4" />;
      case 'disconnected':
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'checking':
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Main Status Indicator */}
      <div className="flex items-center space-x-1">
        <div className={`flex items-center space-x-1 ${getStatusColor(status)}`}>
          {status === 'checking' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === 'connected' ? (
            <Database className="h-4 w-4" />
          ) : (
            <Database className="h-4 w-4" />
          )}
        </div>
        
        <div className={`flex items-center space-x-1 ${getStatusColor(wsStatus)}`}>
          {wsStatus === 'connected' ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center space-x-1">
        <Badge 
          variant={status === 'connected' ? 'default' : status === 'checking' ? 'secondary' : 'destructive'}
          className="text-xs"
        >
          API
        </Badge>
        <Badge 
          variant={wsStatus === 'connected' ? 'default' : wsStatus === 'connecting' ? 'secondary' : 'destructive'}
          className="text-xs"
        >
          WS
        </Badge>
      </div>

      {/* Detailed Status Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Activity className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Backend System Status</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Overall Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  {getStatusIcon(status)}
                  <span>System Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">API Status</p>
                    <p className={`font-medium ${getStatusColor(status)}`}>
                      {status === 'connected' ? 'Connected' : 
                       status === 'checking' ? 'Checking...' : 'Disconnected'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">WebSocket</p>
                    <p className={`font-medium ${getStatusColor(wsStatus)}`}>
                      {wsStatus === 'connected' ? 'Connected' : 
                       wsStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Check</p>
                    <p className="font-medium">
                      {lastCheck ? formatTimestamp(lastCheck.toISOString()) : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Backend URL</p>
                    <p className="font-medium text-xs">http://localhost:5001</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Health Information */}
            {healthData && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Activity className="h-5 w-5" />
                      <span>System Health</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className={`font-medium ${getStatusColor(healthData.status)}`}>
                          {healthData.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Version</p>
                        <p className="font-medium">{healthData.version}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                        <p className="font-medium">{formatUptime(healthData.uptime)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Memory Usage</p>
                        <p className="font-medium">
                          {healthData.memory.used} / {healthData.memory.total} 
                          ({healthData.memory.percentage.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Database className="h-5 w-5" />
                      <span>Database</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className={`font-medium ${getStatusColor(healthData.database.status)}`}>
                          {healthData.database.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tables</p>
                        <p className="font-medium">{healthData.database.tables}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Records</p>
                        <p className="font-medium">{healthData.database.total_records.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium">SQLite</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <Server className="h-5 w-5" />
                      <span>Services</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(healthData.services).map(([service, serviceStatus]) => (
                        <div key={service} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {service.replace('_', ' ')}
                          </span>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(serviceStatus)}
                            <span className={`text-sm font-medium ${getStatusColor(serviceStatus)}`}>
                              {serviceStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={checkHealth} disabled={status === 'checking'}>
                {status === 'checking' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-4 w-4" />
                    Refresh Status
                  </>
                )}
              </Button>
              
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Auto-refresh every 30s</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
