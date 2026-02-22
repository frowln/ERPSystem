import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FileText, Trophy, XCircle } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';
import type { RankingEntry, Participant } from './types';

interface StepPostAwardProps {
  winnerId: string;
  winnerJustification: string;
  ranking: RankingEntry[];
  participants: Participant[];
  comparisonProjectId: string;
  comparisonId: string;
  comparisonTitle: string;
}

export const StepPostAward: React.FC<StepPostAwardProps> = React.memo(({
  winnerId,
  winnerJustification,
  ranking,
  participants,
  comparisonProjectId,
  comparisonId,
  comparisonTitle,
}) => {
  const navigate = useNavigate();
  const winner = ranking.find((r) => r.id === winnerId);
  const winnerParticipant = participants.find((p) => p.id === winnerId);
  const rejectedVendors = ranking.filter((r) => r.id !== winnerId);

  const handleCreatePO = () => {
    const params = new URLSearchParams();
    if (winnerId) params.set('supplierId', winnerId);
    if (comparisonProjectId) params.set('projectId', comparisonProjectId);
    const sourceName = comparisonTitle || comparisonId.slice(0, 8);
    params.set('sourceRequestName', `${t('procurement.tenderEvaluate.postAward.tenderPrefix')} ${sourceName}`);
    navigate(`/procurement/purchase-orders/new?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      {/* Award confirmation banner */}
      <div className="bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={24} className="text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-success-800 dark:text-success-200 mb-1">
              {t('procurement.tenderEvaluate.postAward.awardConfirmed')}
            </h3>
            <p className="text-sm text-success-700 dark:text-success-300">
              {t('procurement.tenderEvaluate.postAward.winnerIs')} <strong>{winner?.name ?? '\u2014'}</strong>
              {winner && ` (${winner.total.toFixed(2)} ${t('procurement.tenderEvaluate.pointsUnit')})`}
            </p>
            {winnerJustification && (
              <p className="text-sm text-success-600 dark:text-success-400 mt-1 italic">
                {winnerJustification}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Create PO action */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
        <div className="flex items-start gap-3 mb-4">
          <FileText size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              {t('procurement.tenderEvaluate.postAward.createPoTitle')}
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('procurement.tenderEvaluate.postAward.createPoHint', { name: winner?.name ?? '\u2014' })}
            </p>
          </div>
        </div>

        {winnerParticipant && (
          <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
              <p className="text-neutral-500 dark:text-neutral-400 mb-0.5">{t('procurement.tenderEvaluate.postAward.vendorName')}</p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{winnerParticipant.name}</p>
            </div>
            {winnerParticipant.email && (
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">
                <p className="text-neutral-500 dark:text-neutral-400 mb-0.5">{t('procurement.tenderEvaluate.postAward.vendorEmail')}</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{winnerParticipant.email}</p>
              </div>
            )}
          </div>
        )}

        <Button onClick={handleCreatePO} iconLeft={<FileText size={16} />}>
          {t('procurement.tenderEvaluate.postAward.createPoBtn')}
        </Button>
      </div>

      {/* Rejected vendors */}
      {rejectedVendors.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={16} className="text-neutral-400" />
            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {t('procurement.tenderEvaluate.postAward.rejectedTitle', { count: String(rejectedVendors.length) })}
            </h4>
          </div>
          <div className="space-y-2">
            {rejectedVendors.map((vendor, index) => (
              <div
                key={vendor.id}
                className="flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-400 w-5 text-center">{index + 2}</span>
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{vendor.name}</span>
                </div>
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400 tabular-nums">
                  {vendor.total.toFixed(2)} {t('procurement.tenderEvaluate.pointsUnit')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Winner podium */}
      {ranking.length >= 2 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-warning-500" />
            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              {t('procurement.tenderEvaluate.postAward.finalRanking')}
            </h4>
          </div>
          <div className="space-y-1.5">
            {ranking.map((entry, index) => {
              const isWinner = entry.id === winnerId;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    isWinner
                      ? 'bg-success-50 dark:bg-success-950/20 border border-success-200 dark:border-success-800'
                      : 'bg-neutral-50 dark:bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300'
                        : index === 1
                          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={`text-sm flex-1 ${isWinner ? 'font-semibold text-success-800 dark:text-success-200' : 'text-neutral-700 dark:text-neutral-300'}`}>
                    {entry.name}
                    {isWinner && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300">
                        {t('procurement.tenderEvaluate.postAward.winnerBadge')}
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium tabular-nums text-neutral-600 dark:text-neutral-400">
                    {entry.total.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

StepPostAward.displayName = 'StepPostAward';
