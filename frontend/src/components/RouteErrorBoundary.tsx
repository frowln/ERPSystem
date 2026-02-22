import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { t } from '@/i18n';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  /** Optional module name shown in the fallback UI */
  moduleName?: string;
}

/**
 * Route-level error boundary. Wraps individual lazy-loaded routes so a crash
 * in one module does not kill the entire application. Other modules remain
 * fully functional.
 */
export class RouteErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // In production, Sentry will capture this automatically via its own
    // boundary integration. Log here for local debugging.
    console.error('[RouteErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { moduleName } = this.props;
    const { error } = this.state;
    const showErrorDetails = import.meta.env.DEV;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="mb-4 p-4 rounded-full bg-danger-50 dark:bg-danger-900/20">
          <AlertTriangle
            size={40}
            className="text-danger-500 dark:text-danger-400"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {moduleName ? t('errorBoundary.titleWithModule', { module: moduleName }) : t('errorBoundary.titleGeneric')}
        </h1>

        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-md">
          {t('errorBoundary.description')}
        </p>

        {showErrorDetails && error && (
          <pre className="mb-6 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-left text-xs text-danger-700 dark:text-danger-300 max-w-xl overflow-auto max-h-40">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        )}

        <div className="flex gap-3 flex-wrap justify-center">
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            {t('errorBoundary.retry')}
          </button>
          <a
            href="/"
            className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {t('errorBoundary.backToHome')}
          </a>
        </div>
      </div>
    );
  }
}
