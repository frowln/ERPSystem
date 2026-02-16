import React from 'react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  loading?: boolean;
  items?: string[];
  maxVisibleItems?: number;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = t('common.confirm'),
  cancelLabel = t('common.cancel'),
  confirmVariant = 'danger',
  loading = false,
  items,
  maxVisibleItems = 5,
}) => {
  const visibleItems = (items ?? []).slice(0, maxVisibleItems);
  const hiddenItemsCount = Math.max((items?.length ?? 0) - visibleItems.length, 0);

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      closeOnOverlayClick={!loading}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      )}
    >
      {visibleItems.length > 0 && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
            {t('confirm.affectedItems')}
          </p>
          <ul className="space-y-1">
            {visibleItems.map((name, idx) => (
              <li key={`${name}-${idx}`} className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                {name}
              </li>
            ))}
          </ul>
          {hiddenItemsCount > 0 && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              {t('confirm.andMore', { count: String(hiddenItemsCount) })}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};
