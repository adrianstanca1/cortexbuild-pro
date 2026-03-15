import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import * as Sentry from '@sentry/react';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  state: GlobalErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0
  };

  static getDerivedStateFromError(error: Error): Partial<GlobalErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Global Error Boundary caught:', error, errorInfo);
    
    this.setState(prev => ({
      errorInfo,
      errorCount: prev.errorCount + 1
    }));

    Sentry.captureException(error, {
      extra: {
        ...errorInfo,
        errorCount: this.state.errorCount + 1,
        componentStack: errorInfo.componentStack
      },
      tags: {
        errorBoundary: 'global',
        errorType: error.name
      }
    });

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.group('Error Boundary Catch');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }

  handleReset = () => {
    this.props.onReset?.();
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoBack = () => {
    window.history.back();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === 'development';
      const { error, errorInfo, errorCount } = this.state;

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Something Went Wrong</h1>
                  <p className="text-red-100 text-sm">
                    {errorCount > 1 
                      ? `This error has occurred ${errorCount} times` 
                      : 'We have encountered an unexpected error'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-medium">
                  {error?.message || 'An unexpected error occurred'}
                </p>
                {isDev && error?.stack && (
                  <pre className="mt-3 text-xs text-red-600 overflow-auto max-h-32 bg-red-100 p-2 rounded">
                    {error.stack.split('\n').slice(0, 5).join('\n')}
                  </pre>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0f5c82] text-white rounded-xl hover:bg-[#0d4d6e] transition-all font-medium"
                >
                  <RefreshCw size={18} />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium"
                >
                  <RefreshCw size={18} />
                  Reload Page
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleGoBack}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                >
                  <ArrowLeft size={18} />
                  Go Back
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium"
                >
                  <Home size={18} />
                  Go Home
                </button>
              </div>

              {isDev && errorInfo?.componentStack && (
                <div className="mt-6 border-t pt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">Component Stack:</p>
                  <pre className="text-xs text-slate-600 bg-slate-100 p-3 rounded-lg overflow-auto max-h-48">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="text-center text-sm text-slate-500 pt-4 border-t">
                <p>If this problem persists, please contact support</p>
                <p className="text-xs mt-1 font-mono">Error ID: {error?.name || 'Unknown'}_{Date.now()}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
