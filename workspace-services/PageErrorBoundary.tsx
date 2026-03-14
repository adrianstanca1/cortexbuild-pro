import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import * as Sentry from '@sentry/react';

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName: string;
  fallback?: ReactNode;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  state: PageErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Page Error Boundary [${this.props.pageName}]:`, error, errorInfo);
    
    Sentry.captureException(error, {
      extra: {
        pageName: this.props.pageName,
        componentStack: errorInfo.componentStack
      },
      tags: {
        errorBoundary: 'page',
        pageName: this.props.pageName
      }
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Error Loading {this.props.pageName}</h2>
                  <p className="text-red-100 text-sm">This page encountered an error</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">
                  {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0f5c82] text-white rounded-lg hover:bg-[#0d4d6e] transition-colors text-sm font-medium"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;
