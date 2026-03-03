import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { Loader2, Database, Wifi } from 'lucide-react';
import backendApi from '../../services/backendApi';

interface BackendLoginProps {
  onLogin: (user: any, company?: any) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function BackendLogin({ onLogin, addToast }: BackendLoginProps) {
  const [credentials, setCredentials] = useState({
    email: 'admin@buildcorp.com',
    password: 'password123'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  // Helper functions for status styling and messaging
  const getStatusClassName = (status: typeof backendStatus): string => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusText = (status: typeof backendStatus): string => {
    switch (status) {
      case 'checking': return 'Checking...';
      case 'connected': return 'Connected';
      default: return 'Disconnected';
    }
  };

  const getStatusMessage = (status: typeof backendStatus): string => {
    switch (status) {
      case 'connected': return 'Backend API is running and ready for authentication.';
      case 'disconnected': return 'Backend API is not available. Please start the backend server.';
      default: return 'Checking backend connectivity...';
    }
  };

  // Check backend connectivity on mount
  React.useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      await backendApi.getHealthCheck();
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('disconnected');
      console.error('Backend health check failed:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await backendApi.login(credentials);

      // Transform backend user to match frontend expectations
      const user = {
        id: response.user.id,
        email: response.user.email,
        name: `${response.user.first_name} ${response.user.last_name}`,
        firstName: response.user.first_name,
        lastName: response.user.last_name,
        role: response.user.role,
        companyId: response.user.company_id,
        avatar: response.user.avatar_url,
        phone: response.user.phone,
        isActive: response.user.is_active
      };

      const company = response.company ? {
        id: response.company.id,
        name: response.company.name,
        type: response.company.type,
        email: response.company.email,
        phone: response.company.phone,
        address: response.company.address,
        website: response.company.website
      } : undefined;

      onLogin(user, company);
      addToast(`Welcome back, ${user.firstName}!`, 'success');
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
      addToast('Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email: string, password: string, name: string) => {
    setCredentials({ email, password });
    addToast(`Quick login as ${name}`, 'info');
  };

  const getStatusColor = (status: 'checking' | 'connected' | 'disconnected'): string => {
    if (status === 'connected') return 'text-green-600';
    if (status === 'disconnected') return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusText = (status: 'checking' | 'connected' | 'disconnected'): string => {
    if (status === 'checking') return 'Checking...';
    if (status === 'connected') return 'Connected';
    return 'Disconnected';
  };

  const getStatusMessage = (status: 'checking' | 'connected' | 'disconnected'): string => {
    if (status === 'connected') return 'Backend API is running and ready for authentication.';
    if (status === 'disconnected') return 'Backend API is not available. Please start the backend server.';
    return 'Checking backend connectivity...';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Backend Status */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Backend Status</CardTitle>
              <div className="flex items-center space-x-2">
                {backendStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
                {backendStatus === 'connected' && <Wifi className="h-4 w-4 text-green-500" />}
                {backendStatus === 'disconnected' && <Database className="h-4 w-4 text-red-500" />}
                <span className={`text-sm font-medium ${getStatusColor(backendStatus)}`}>
                  {getStatusText(backendStatus)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {getStatusMessage(backendStatus)}
            </p>
            {backendStatus === 'disconnected' && (
              <Button
                variant="outline"
                size="sm"
                onClick={checkBackendStatus}
                className="mt-2"
              >
                Retry Connection
              </Button>
            )}
          </CardContent>
        </Card >

        {/* Login Form */}
        < Card className="border-2" >
          <CardHeader>
            <CardTitle className="text-2xl text-center">ASAgents Platform</CardTitle>
            <p className="text-center text-muted-foreground">
              Sign in to your construction management account
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading || backendStatus !== 'connected'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading || backendStatus !== 'connected'}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || backendStatus !== 'connected'}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card >

        {/* Quick Login Options */}
        {
          backendStatus === 'connected' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Login (Demo)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Use these demo accounts to explore the platform
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('admin@buildcorp.com', 'password123', 'Admin')}
                    disabled={loading}
                  >
                    Admin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('manager@buildcorp.com', 'password123', 'Manager')}
                    disabled={loading}
                  >
                    Manager
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('worker@buildcorp.com', 'password123', 'Worker')}
                    disabled={loading}
                  >
                    Worker
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => quickLogin('client@metroproperties.com', 'password123', 'Client')}
                    disabled={loading}
                  >
                    Client
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        }

        {/* Backend Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Backend API: <code className="text-xs">http://localhost:5001</code>
              </p>
              <p className="text-sm text-muted-foreground">
                WebSocket: <code className="text-xs">ws://localhost:5001/ws</code>
              </p>
              <p className="text-xs text-muted-foreground">
                Make sure the backend server is running on port 5001
              </p>
            </div>
          </CardContent>
        </Card>
      </div >
    </div >
  );
}
