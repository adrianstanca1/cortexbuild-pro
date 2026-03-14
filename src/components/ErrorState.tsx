import React from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Home } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  onBack?: () => void;
  onHome?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while processing your request.',
  error,
  onRetry,
  onBack,
  onHome,
  showDetails = false,
  className = ''
}) => {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{message}</p>
          
          {showDetails && errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-sm text-red-700 font-mono break-all">{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-[#0f5c82] text-white rounded-lg hover:bg-[#0d4d6e] transition-colors font-medium"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          )}
          
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              <ArrowLeft size={18} />
              Go Back
            </button>
          )}
          
          {onHome && (
            <button
              onClick={onHome}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              <Home size={18} />
              Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
