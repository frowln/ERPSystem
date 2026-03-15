import React from 'react';
import { ArrowRight, Mail, ShoppingCart, Sparkles, Target } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { t } from '@/i18n';
import { competitiveListStatusColorMap, competitiveListStatusLabels, STATUS_TRANSITIONS } from './ClTypes';
import type { CompetitiveListStatus } from '@/types';

interface ClStatusActionsProps {
  status: CompetitiveListStatus | undefined;
  hasEntries: boolean;
  hasWinner: boolean;
  canCreatePO: boolean;
  onStatusChange: (status: string) => void;
  onAutoRank: () => void;
  onAutoSelect: () => void;
  onCreatePurchaseOrder: () => void;
  onSendRfq: () => void;
  statusPending: boolean;
  autoRankPending: boolean;
  autoSelectPending: boolean;
  rfqPending: boolean;
}

export const ClStatusActions: React.FC<ClStatusActionsProps> = ({
  status,
  hasEntries,
  hasWinner,
  canCreatePO,
  onStatusChange,
  onAutoRank,
  onAutoSelect,
  onCreatePurchaseOrder,
  onSendRfq,
  statusPending,
  autoRankPending,
  autoSelectPending,
  rfqPending,
}) => {
  const transitions = STATUS_TRANSITIONS[status ?? ''] ?? [];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <StatusBadge
        status={status ?? ''}
        colorMap={competitiveListStatusColorMap}
        label={competitiveListStatusLabels[status ?? ''] ?? status ?? ''}
        size="md"
      />
      {hasEntries && status !== 'APPROVED' && (
        <>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Mail size={13} />}
            loading={rfqPending}
            onClick={onSendRfq}
          >
            {t('competitiveList.sendRfq')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Sparkles size={13} />}
            loading={autoRankPending}
            onClick={onAutoRank}
          >
            {t('competitiveList.autoRank')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Target size={13} />}
            loading={autoSelectPending}
            onClick={onAutoSelect}
          >
            {t('competitiveList.autoSelectBest')}
          </Button>
        </>
      )}
      {transitions.map((tr) => (
        <Button
          key={tr.next}
          variant={tr.variant}
          size="sm"
          iconRight={<ArrowRight size={13} />}
          loading={statusPending}
          onClick={() => onStatusChange(tr.next)}
        >
          {t(tr.label)}
        </Button>
      ))}
      {(status === 'DECIDED' || status === 'APPROVED') && (
        <Button
          variant="primary"
          size="sm"
          iconLeft={<ShoppingCart size={14} />}
          disabled={!canCreatePO}
          title={!hasWinner ? t('specifications.clSelectWinnerFirst') : undefined}
          onClick={onCreatePurchaseOrder}
        >
          {t('specifications.clCreateOrder')}
        </Button>
      )}
    </div>
  );
};
