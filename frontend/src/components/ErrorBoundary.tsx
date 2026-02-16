import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { t } from '@/i18n';
import { Sentry } from '@/lib/sentry';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);

    this.props.onError?.(error, errorInfo);

    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4" role="alert">
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-4 text-danger-500">
              <AlertTriangle size={48} strokeWidth={1.5} aria-hidden />
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {t('errors.generic')}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {t('errors.serverErrorDescription')}
            </p>
            {this.state.error && (
              <details className="mb-6 text-left bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4">
                <summary className="cursor-pointer text-sm text-neutral-500 dark:text-neutral-400">
                  {t('common.details')}
                </summary>
                <pre className="mt-2 text-xs text-danger-600 dark:text-danger-400 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                aria-label={t('errors.tryAgain')}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('errors.tryAgain')}
              </button>
              <button
                onClick={this.handleGoHome}
                aria-label={t('errors.goHome')}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
              >
                {t('errors.goHome')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
