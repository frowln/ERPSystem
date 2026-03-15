import React from 'react';
import { Trophy } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Textarea } from '@/design-system/components/FormField';
import { t } from '@/i18n';

interface ClWinnerModalProps {
  open: boolean;
  onClose: () => void;
  winnerReason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export const ClWinnerModal: React.FC<ClWinnerModalProps> = ({
  open,
  onClose,
  winnerReason,
  onReasonChange,
  onConfirm,
  isPending,
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title={t('competitiveList.detail.selectWinner')}
    size="sm"
    footer={
      <>
        <Button variant="secondary" size="sm" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="success"
          size="sm"
          iconLeft={<Trophy size={14} />}
          loading={isPending}
          onClick={onConfirm}
        >
          {t('common.confirm')}
        </Button>
      </>
    }
  >
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {t('competitiveList.detail.selectWinner')}
      </p>
      <FormField label={t('common.notes')}>
        <Textarea
          value={winnerReason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={3}
          placeholder={t('common.notes')}
        />
      </FormField>
    </div>
  </Modal>
);
