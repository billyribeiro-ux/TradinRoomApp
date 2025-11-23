// ============================================================================
// MICROSOFT ERROR BOUNDARY - Enterprise Standard
// ============================================================================
import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

import { logger } from '../utils/productionLogger';

// Use logger with 'log' alias for backward compatibility
const log = {
  error: (msg: string, err?: Error, ctx?: Record<string, unknown>) => logger.error(msg, err, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => logger.warn(msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => logger.info(msg, ctx),
  debug: (msg: string, ctx?: Record<string, unknown>) => logger.debug(msg, ctx),
  critical: (msg: string, err?: Error, ctx?: Record<string, unknown>) => {
    // Critical logs as errors with CRITICAL prefix
    logger.error(`[CRITICAL] ${msg}`, err, ctx);
  },
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    log.critical('React Error Boundary caught error', error, {
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-red-500 rounded-lg p-6 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            </div>
            <p className="text-slate-300 mb-4">
              An unexpected error occurred. Please refresh the page or contact support if the problem persists.
            </p>
            {this.state.error && import.meta.env.DEV && (
              <details className="mt-4 p-3 bg-slate-900 rounded border border-slate-700">
                <summary className="text-sm text-slate-400 cursor-pointer">Error details</summary>
                <pre className="mt-2 text-xs text-red-400 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
