import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Page } from '@/types';

const AuthCallbackView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const urlToken = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(getErrorMessage(error));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }

    if (urlToken && userStr) {
      try {
        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userStr));
        
        // Save token to localStorage - AuthContext will hydrate from it
        localStorage.setItem('token', urlToken);
        localStorage.setItem('user_role', user.role);
        localStorage.setItem('companyId', user.companyId || '');
        localStorage.setItem('userId', user.id || '');
        
        setStatus('success');
        setMessage('Successfully authenticated! Redirecting...');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard'; // Use full page reload to ensure auth state is fresh
        }, 1500);
      } catch (err) {
        console.error('Failed to process OAuth callback:', err);
        setStatus('error');
        setMessage('Failed to process authentication data');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } else {
      setStatus('error');
      setMessage('Invalid authentication response');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  }, [searchParams, navigate]);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'oauth_failed':
        return 'OAuth authentication failed. Please try again.';
      case 'oauth_callback_failed':
        return 'Failed to process OAuth callback. Please try again.';
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Authenticating</h2>
                  <p className="text-slate-400">{message}</p>
                </div>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                  <CheckCircle className="relative w-16 h-16 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Success!</h2>
                  <p className="text-slate-400">{message}</p>
                </div>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                  <XCircle className="relative w-16 h-16 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
                  <p className="text-slate-400">{message}</p>
                  <p className="text-sm text-slate-500 mt-2">Redirecting to login...</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackView;
