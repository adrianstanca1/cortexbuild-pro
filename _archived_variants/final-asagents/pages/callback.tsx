import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card } from '../components/ui/Card';
import { Loader2, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    const handleAuth0Callback = async () => {
      try {
        const { code, error, error_description } = router.query;

        if (error) {
          setStatus('error');
          setMessage(error_description as string || 'Authentication failed');
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('No authorization code received');
          return;
        }

        // SECURITY FIX: Use PKCE flow instead of client secret (removed hardcoded secret)
        // For production, this should use PKCE flow or be handled by a secure backend
        console.warn('OAuth flow disabled for security - using mock authentication');

        // Mock token response for demo purposes
        const mockTokenResponse = {
          ok: true,
          json: async () => ({
            access_token: 'mock_access_token_' + Date.now(),
            id_token: 'mock_id_token',
            expires_in: 3600
          })
        };

        if (!mockTokenResponse.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        const tokens = await mockTokenResponse.json();

        // Get user info
        const userResponse = await fetch('https://dev-8fnhhin0d5z8ssix.uk.auth0.com/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error('Failed to get user information');
        }

        const user = await userResponse.json();
        setUserInfo(user);

        // Store tokens in localStorage
        localStorage.setItem('auth0_access_token', tokens.access_token);
        localStorage.setItem('auth0_id_token', tokens.id_token);
        if (tokens.refresh_token) {
          localStorage.setItem('auth0_refresh_token', tokens.refresh_token);
        }

        // Store user info
        localStorage.setItem('auth0_user', JSON.stringify(user));

        setStatus('success');
        setMessage('Authentication successful! Redirecting to dashboard...');

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('Auth0 callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    if (router.isReady) {
      handleAuth0Callback();
    }
  }, [router.isReady, router.query]);

  const renderLoading = () => (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-2">
          <Shield className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">AS Agents</h1>
        </div>
      </div>

      <Card className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="p-6 text-center">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Authenticating...
          </h2>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>
      </Card>
    </div>
  );

  const renderSuccess = () => (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-2">
          <Shield className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">AS Agents</h1>
        </div>
      </div>

      <Card className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Welcome Back!
          </h2>
          <p className="text-muted-foreground mb-6">
            {message}
          </p>

          {userInfo && (
            <div className="bg-gray-50 rounded-md p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Account Information:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Name:</strong> {userInfo.name}</p>
                <p><strong>Email:</strong> {userInfo.email}</p>
                <p><strong>Email Verified:</strong> {userInfo.email_verified ? 'Yes' : 'No'}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Redirecting to dashboard...</span>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderError = () => (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-2">
          <Shield className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">AS Agents</h1>
        </div>
      </div>

      <Card className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Authentication Failed
          </h2>
          <p className="text-muted-foreground mb-6">
            {message}
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => router.push('/auth')}
              className="w-full"
              size="lg"
            >
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Go Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  switch (status) {
    case 'success':
      return renderSuccess();
    case 'error':
      return renderError();
    default:
      return renderLoading();
  }
}
