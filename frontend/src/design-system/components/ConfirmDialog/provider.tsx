import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ConfirmDialog } from './index';
import { guardDemoModeAction } from '@/lib/demoMode';

export interface ConfirmDialogOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  items?: string[];
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

interface ActiveConfirmRequest {
  options: ConfirmDialogOptions;
  resolve: (result: boolean) => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [request, setRequest] = useState<ActiveConfirmRequest | null>(null);
  const requestRef = useRef<ActiveConfirmRequest | null>(null);

  const cleanup = useCallback((result: boolean) => {
    const activeRequest = requestRef.current;
    if (!activeRequest) return;
    activeRequest.resolve(result);
    requestRef.current = null;
    setRequest(null);
  }, []);

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    if (guardDemoModeAction(options.confirmLabel ?? options.title)) {
      return Promise.resolve(false);
    }

    if (requestRef.current) {
      // Resolve previous request as cancelled to avoid dangling promise.
      requestRef.current.resolve(false);
    }

    return new Promise<boolean>((resolve) => {
      const nextRequest: ActiveConfirmRequest = { options, resolve };
      requestRef.current = nextRequest;
      setRequest(nextRequest);
    });
  }, []);

  const contextValue = useMemo<ConfirmDialogContextValue>(
    () => ({ confirm }),
    [confirm],
  );

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog
        open={!!request}
        onClose={() => cleanup(false)}
        onConfirm={() => cleanup(true)}
        title={request?.options.title ?? ''}
        description={request?.options.description}
        confirmLabel={request?.options.confirmLabel}
        cancelLabel={request?.options.cancelLabel}
        confirmVariant={request?.options.confirmVariant}
        items={request?.options.items}
      />
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmDialog = (): ConfirmDialogContextValue['confirm'] => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context.confirm;
};
