import { AlertTriangle } from 'lucide-react';
import { t } from '@/i18n';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorFallback({ title, message, onRetry }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950/30"
    >
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
        {title ?? t('errorBoundary.titleGeneric')}
      </h2>
      {message && (
        <p className="max-w-md text-center text-sm text-red-600 dark:text-red-300">{message}</p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
        >
          {t('errorBoundary.retry')}
        </button>
      )}
    </div>
  );
}
