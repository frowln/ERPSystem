import React from 'react';
import { Download, FileUp } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';
import { ClStatusActions } from './ClStatusActions';
import type { CompetitiveListStatus } from '@/types';

interface ClPageHeaderProps {
  name: string;
  specId: string;
  status: CompetitiveListStatus | undefined;
  hasEntries: boolean;
  hasWinner: boolean;
  canCreatePO: boolean;
  onStatusChange: (status: string) => void;
  onAutoRank: () => void;
  onAutoSelect: () => void;
  onAutoSelectByRatio: () => void;
  onCreatePurchaseOrder: () => void;
  onSendRfq: () => void;
  onImportInvoice: () => void;
  onExport: () => void;
  statusPending: boolean;
  autoRankPending: boolean;
  autoSelectPending: boolean;
  rfqPending: boolean;
}

export const ClPageHeader: React.FC<ClPageHeaderProps> = ({
  name,
  specId,
  status,
  hasEntries,
  hasWinner,
  canCreatePO,
  onStatusChange,
  onAutoRank,
  onAutoSelect,
  onAutoSelectByRatio,
  onCreatePurchaseOrder,
  onSendRfq,
  onImportInvoice,
  onExport,
  statusPending,
  autoRankPending,
  autoSelectPending,
  rfqPending,
}) => {
  return (
    <PageHeader
      title={name || t('competitiveList.title')}
      backTo={`/specifications/${specId}`}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <ClStatusActions
            status={status}
            hasEntries={hasEntries}
            hasWinner={hasWinner}
            canCreatePO={canCreatePO}
            onStatusChange={onStatusChange}
            onAutoRank={onAutoRank}
            onAutoSelect={onAutoSelect}
            onCreatePurchaseOrder={onCreatePurchaseOrder}
            onSendRfq={onSendRfq}
            statusPending={statusPending}
            autoRankPending={autoRankPending}
            autoSelectPending={autoSelectPending}
            rfqPending={rfqPending}
          />
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<FileUp size={14} />}
            onClick={onImportInvoice}
          >
            {t('competitiveList.matrix.importInvoice')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Download size={14} />}
            onClick={onExport}
          >
            {t('common.export')}
          </Button>
        </div>
      }
    />
  );
};
