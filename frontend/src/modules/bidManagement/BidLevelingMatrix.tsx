import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input } from '@/design-system/components/FormField';
import { bidManagementApi, type LevelingMatrix } from '@/api/bidManagement';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

interface Props {
  packageId: string;
}

const BidLevelingMatrix: React.FC<Props> = ({ packageId }) => {
  const queryClient = useQueryClient();
  const [addCriteriaOpen, setAddCriteriaOpen] = useState(false);
  const [criteriaForm, setCriteriaForm] = useState({
    criteriaName: '',
    maxScore: '10',
    weight: '1.0',
  });

  const { data: matrix, isLoading } = useQuery<LevelingMatrix>({
    queryKey: ['bid-leveling', packageId],
    queryFn: () => bidManagementApi.getLevelingMatrix(packageId),
  });

  const evalMutation = useMutation({
    mutationFn: (payload: { invitationId: string; criteriaName: string; score: number; maxScore: number; weight: number }) =>
      bidManagementApi.createEvaluation(packageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bid-leveling', packageId] });
      queryClient.invalidateQueries({ queryKey: ['bid-evaluations', packageId] });
    },
    onError: () => toast.error(t('common.error')),
  });

  const handleAddCriteria = () => {
    if (!criteriaForm.criteriaName.trim()) return;
    if (!matrix?.invitations.length) {
      toast.error(t('bidManagement.noInvitations'));
      return;
    }
    // Create evaluation entries for all invitations with score=0
    const promises = matrix.invitations.map((inv) =>
      bidManagementApi.createEvaluation(packageId, {
        invitationId: inv.id,
        criteriaName: criteriaForm.criteriaName,
        score: 0,
        maxScore: parseInt(criteriaForm.maxScore) || 10,
        weight: parseFloat(criteriaForm.weight) || 1.0,
      })
    );
    Promise.all(promises).then(() => {
      queryClient.invalidateQueries({ queryKey: ['bid-leveling', packageId] });
      setAddCriteriaOpen(false);
      setCriteriaForm({ criteriaName: '', maxScore: '10', weight: '1.0' });
      toast.success(t('common.created'));
    });
  };

  const handleScoreChange = (invitationId: string, criteriaName: string, newScore: number, maxScore: number, weight: number) => {
    evalMutation.mutate({ invitationId, criteriaName, score: newScore, maxScore, weight });
  };

  if (isLoading) return <div className="text-center py-8 text-neutral-500">{t('common.loading')}</div>;
  if (!matrix) return null;

  const { invitations, criteria, scores, totals } = matrix;

  // Find highest total for highlighting winner
  let highestTotal = 0;
  let winnerId = '';
  for (const [invId, total] of Object.entries(totals)) {
    if (total > highestTotal) {
      highestTotal = total;
      winnerId = invId;
    }
  }

  const getScoreColor = (score: number, max: number) => {
    if (max === 0) return '';
    const pct = (score / max) * 100;
    if (pct >= 70) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    if (pct >= 40) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('bidManagement.levelingMatrix')}
        </h3>
        <Button size="sm" variant="outline" onClick={() => setAddCriteriaOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('bidManagement.addCriteria')}
        </Button>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          {t('bidManagement.noInvitations')}
        </div>
      ) : criteria.length === 0 ? (
        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
          {t('bidManagement.addCriteria')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800">
                <th className="text-left px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 min-w-[180px]">
                  {t('bidManagement.criteria')}
                </th>
                {invitations.map((inv) => (
                  <th
                    key={inv.id}
                    className={cn(
                      'text-center px-3 py-2 font-medium border border-neutral-200 dark:border-neutral-700 min-w-[140px]',
                      inv.id === winnerId && highestTotal > 0
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'text-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    <div>{inv.vendorName}</div>
                    {inv.bidAmount != null && (
                      <div className="text-xs font-normal text-neutral-500">
                        {Number(inv.bidAmount).toLocaleString('ru-RU')} ₽
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {criteria.map((crit) => (
                <tr key={crit} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-3 py-2 font-medium text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                    {crit}
                  </td>
                  {invitations.map((inv) => {
                    const cell = scores[inv.id]?.[crit];
                    const score = cell?.score ?? 0;
                    const maxScore = cell?.maxScore ?? 10;
                    return (
                      <td
                        key={inv.id}
                        className={cn(
                          'text-center px-3 py-2 border border-neutral-200 dark:border-neutral-700',
                          getScoreColor(score, maxScore)
                        )}
                      >
                        <input
                          type="number"
                          min={0}
                          max={maxScore}
                          value={score}
                          onChange={(e) => {
                            const val = Math.min(maxScore, Math.max(0, parseInt(e.target.value) || 0));
                            handleScoreChange(inv.id, crit, val, maxScore, cell?.weight ?? 1);
                          }}
                          className="w-12 text-center bg-transparent border-none focus:ring-1 focus:ring-primary-500 rounded"
                        />
                        <span className="text-xs text-neutral-400">/{maxScore}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-neutral-100 dark:bg-neutral-800 font-semibold">
                <td className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
                  {t('bidManagement.weightedTotal')}
                </td>
                {invitations.map((inv) => (
                  <td
                    key={inv.id}
                    className={cn(
                      'text-center px-3 py-2 border border-neutral-200 dark:border-neutral-700',
                      inv.id === winnerId && highestTotal > 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'text-neutral-700 dark:text-neutral-300'
                    )}
                  >
                    {Number(totals[inv.id] ?? 0).toFixed(1)}%
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Add Criteria Modal */}
      <Modal open={addCriteriaOpen} onClose={() => setAddCriteriaOpen(false)} title={t('bidManagement.addCriteria')}>
        <div className="space-y-4">
          <FormField label={t('bidManagement.criteria')} required>
            <Input
              value={criteriaForm.criteriaName}
              onChange={(e) => setCriteriaForm(prev => ({ ...prev, criteriaName: e.target.value }))}
              placeholder={t('bidManagement.criteria')}
            />
          </FormField>
          <FormField label={t('bidManagement.maxScore')}>
            <Input
              type="number"
              value={criteriaForm.maxScore}
              onChange={(e) => setCriteriaForm(prev => ({ ...prev, maxScore: e.target.value }))}
              min={1}
            />
          </FormField>
          <FormField label={t('bidManagement.weight')}>
            <Input
              type="number"
              step="0.1"
              value={criteriaForm.weight}
              onChange={(e) => setCriteriaForm(prev => ({ ...prev, weight: e.target.value }))}
              min={0}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAddCriteriaOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddCriteria}>{t('common.create')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BidLevelingMatrix;
