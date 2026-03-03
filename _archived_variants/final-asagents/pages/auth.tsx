import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader2, Shield, LogIn, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import { RegistrationForm } from '../components/auth/RegistrationForm';
import { registrationService } from '../services'/registrationService';

type AuthMode = 'login' | 'register' | 'success' | 'error';

interface AuthResult {
  success: boolean;
  user?: any;
  tenant?: any;
  message?: string;
  error?: string;
  requiresEmailVerification?: boolean;
}

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuthResult | null>(null);

  const handleRegistrationSuccess = (result: AuthResult) => {
    setResult(result);
    setMode('success');
  };

  const handleRegistrationError = (error: string) => {
    setResult({ success: false, error });
    setMode('error');
  };

  const handleAuth0Login = async () => {
    setLoading(true);
    try {
      // Redirect to Auth0 login
      window.location.href = `https://dev-8fnhhin0d5z8ssix.uk.auth0.com/authorize?` +
        `response_type=code&` +
        `client_id=1WgarJEA0yN8ArT6aeoF6NvqQiEQ5bfK&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/callback')}&` +
        `scope=openid profile email&` +
        `audience=https://asagents.co.uk/api`;
    } catch (error) {
      console.error('Auth0 login failed:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      });
      setMode('error');
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center gap-2 mb-2">
          <Shield className="w-10 h-10 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">AS Agents</h1>
        </div>
        <h2 className="text-muted-foreground">
          Sign in to your account
        </h2>
      </div>

      <Card className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="p-6">
          <div className="space-y-4">
            <Button
              onClick={handleAuth0Login}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              Sign in with Auth0
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setMode('register')}
              className="w-full"
              size="lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create new account
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Secure authentication powered by Auth0
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSuccessMessage = () => (
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
            Registration Successful!
          </h2>
          <p className="text-muted-foreground mb-6">
            {result?.message || 'Your account has been created successfully.'}
          </p>

          {result?.requiresEmailVerification && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <p className="text-sm text-blue-800">
                Please check your email and click the verification link to activate your account.
              </p>
            </div>
          )}

          {result?.user && (
            <div className="bg-gray-50 rounded-md p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Account Details:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Name:</strong> {result.user.name}</p>
                <p><strong>Email:</strong> {result.user.email}</p>
                {result.tenant && (
                  <p><strong>Organization:</strong> {result.tenant.name}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleAuth0Login}
              className="w-full"
              size="lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In Now
            </Button>

            <Button
              variant="outline"
              onClick={() => setMode('login')}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderErrorMessage = () => (
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
            Registration Failed
          </h2>
          <p className="text-muted-foreground mb-6">
            {result?.error || 'An error occurred during registration.'}
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => setMode('register')}
              className="w-full"
              size="lg"
            >
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => setMode('login')}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  switch (mode) {
    case 'register':
      return (
        <RegistrationForm
          onSuccess={handleRegistrationSuccess}
          onError={handleRegistrationError}
          onSwitchToLogin={() => setMode('login')}
        />
      );
    case 'success':
      return renderSuccessMessage();
    case 'error':
      return renderErrorMessage();
    default:
      return renderLoginForm();
  }
}
