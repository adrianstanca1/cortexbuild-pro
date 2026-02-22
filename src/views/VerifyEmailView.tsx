import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import axios from 'axios';

const VerifyEmailView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        const response = await axios.get(`${apiUrl}/email/verify/${token}`);
        
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        console.error('Email verification failed:', error);
        setStatus('error');
        setMessage(
          error.response?.data?.error || 
          error.response?.data?.message ||
          'Verification failed. The link may be invalid or expired.'
        );
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Icon */}
            <div className="relative">
              {status === 'loading' && (
                <>
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                  <Mail className="relative w-16 h-16 text-indigo-500" />
                  <Loader2 className="absolute inset-0 w-16 h-16 text-indigo-400 animate-spin" />
                </>
              )}
              
              {status === 'success' && (
                <>
                  <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                  <CheckCircle className="relative w-16 h-16 text-green-500" />
                </>
              )}
              
              {status === 'error' && (
                <>
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                  <XCircle className="relative w-16 h-16 text-red-500" />
                </>
              )}
            </div>

            {/* Content */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {status === 'loading' && 'Verifying Email'}
                {status === 'success' && 'Email Verified!'}
                {status === 'error' && 'Verification Failed'}
              </h2>
              <p className="text-slate-400">{message}</p>
              
              {status === 'success' && (
                <p className="text-sm text-slate-500 mt-4">
                  Redirecting to login in 3 seconds...
                </p>
              )}
              
              {status === 'error' && (
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all"
                  >
                    Return to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailView;
