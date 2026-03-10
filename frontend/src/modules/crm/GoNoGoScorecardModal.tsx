import React, { useState, useMemo } from 'react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export interface GoNoGoCriterion {
  id: string;
  category: 'opportunity' | 'win' | 'delivery';
  labelKey: string;
  score: number; // 1-5
}

const CRITERIA: Omit<GoNoGoCriterion, 'score'>[] = [
  // Opportunity Quality (weight 0.35)
  { id: 'opp_strategic', category: 'opportunity', labelKey: 'crm.goNogo.criterionStrategicFit' },
  { id: 'opp_revenue', category: 'opportunity', labelKey: 'crm.goNogo.criterionRevenuePotential' },
  { id: 'opp_timeline', category: 'opportunity', labelKey: 'crm.goNogo.criterionTimelineFeasibility' },
  { id: 'opp_funded', category: 'opportunity', labelKey: 'crm.goNogo.criterionProjectFunded' },
  { id: 'opp_relationship', category: 'opportunity', labelKey: 'crm.goNogo.criterionClientRelationship' },
  // Win Likelihood (weight 0.35)
  { id: 'win_competitive', category: 'win', labelKey: 'crm.goNogo.criterionCompetitivePosition' },
  { id: 'win_price', category: 'win', labelKey: 'crm.goNogo.criterionPriceCompetitiveness' },
  { id: 'win_decision', category: 'win', labelKey: 'crm.goNogo.criterionDecisionMakerAccess' },
  { id: 'win_budget', category: 'win', labelKey: 'crm.goNogo.criterionBudgetAvailability' },
  { id: 'win_qualification', category: 'win', labelKey: 'crm.goNogo.criterionQualificationMatch' },
  // Delivery Capability (weight 0.30)
  { id: 'del_resources', category: 'delivery', labelKey: 'crm.goNogo.criterionResourceAvailability' },
  { id: 'del_subcontractor', category: 'delivery', labelKey: 'crm.goNogo.criterionSubcontractorCapacity' },
  { id: 'del_experience', category: 'delivery', labelKey: 'crm.goNogo.criterionSimilarExperience' },
  { id: 'del_logistics', category: 'delivery', labelKey: 'crm.goNogo.criterionLocationLogistics' },
  { id: 'del_risk', category: 'delivery', labelKey: 'crm.goNogo.criterionRiskTolerance' },
];

const CRITERION_HINT_KEYS: Record<string, string> = {
  opp_strategic: 'crm.goNogo.hintStrategicFit',
  opp_revenue: 'crm.goNogo.hintRevenuePotential',
  opp_timeline: 'crm.goNogo.hintTimelineFeasibility',
  opp_funded: 'crm.goNogo.hintProjectFunded',
  opp_relationship: 'crm.goNogo.hintClientRelationship',
  win_competitive: 'crm.goNogo.hintCompetitivePosition',
  win_price: 'crm.goNogo.hintPriceCompetitiveness',
  win_decision: 'crm.goNogo.hintDecisionMakerAccess',
  win_budget: 'crm.goNogo.hintBudgetAvailability',
  win_qualification: 'crm.goNogo.hintQualificationMatch',
  del_resources: 'crm.goNogo.hintResourceAvailability',
  del_subcontractor: 'crm.goNogo.hintSubcontractorCapacity',
  del_experience: 'crm.goNogo.hintSimilarExperience',
  del_logistics: 'crm.goNogo.hintLocationLogistics',
  del_risk: 'crm.goNogo.hintRiskTolerance',
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  opportunity: 0.35,
  win: 0.35,
  delivery: 0.30,
};

const CATEGORY_LABELS: Record<string, string> = {
  opportunity: 'crm.goNogo.categoryOpportunity',
  win: 'crm.goNogo.categoryWin',
  delivery: 'crm.goNogo.categoryDelivery',
};

const SCORE_LABEL_KEYS: Record<number, string> = {
  1: 'crm.goNogo.scoreVeryLow',
  2: 'crm.goNogo.scoreLow',
  3: 'crm.goNogo.scoreMedium',
  4: 'crm.goNogo.scoreHigh',
  5: 'crm.goNogo.scoreVeryHigh',
};

const CATEGORY_COLORS: Record<string, string> = {
  opportunity: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  win: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  delivery: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
};

function computeResult(scores: Record<string, number>): { totalScore: number; weightedScore: number; result: 'GO' | 'CONDITIONAL' | 'NO_GO'; allRated: boolean } {
  const categories = ['opportunity', 'win', 'delivery'] as const;
  let weightedScore = 0;
  let totalScore = 0;
  const allRated = CRITERIA.every((c) => scores[c.id] > 0);

  for (const cat of categories) {
    const catCriteria = CRITERIA.filter((c) => c.category === cat);
    const catSum = catCriteria.reduce((sum, c) => sum + (scores[c.id] || 0), 0);
    const catMax = catCriteria.length * 5;
    const catPct = catSum / catMax;
    weightedScore += catPct * CATEGORY_WEIGHTS[cat] * 100;
    totalScore += catSum;
  }

  const result: 'GO' | 'CONDITIONAL' | 'NO_GO' =
    weightedScore >= 73 ? 'GO' : weightedScore >= 47 ? 'CONDITIONAL' : 'NO_GO';

  return { totalScore, weightedScore: Math.round(weightedScore), result, allRated };
}

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: Record<string, number>;
  onSave: (data: { scores: Record<string, number>; totalScore: number; weightedScore: number; result: 'GO' | 'CONDITIONAL' | 'NO_GO' }) => void;
  loading?: boolean;
}

const GoNoGoScorecardModal: React.FC<Props> = ({ open, onClose, initialData, onSave, loading }) => {
  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (initialData) return { ...initialData };
    const defaults: Record<string, number> = {};
    CRITERIA.forEach((c) => { defaults[c.id] = 0; });
    return defaults;
  });

  const { totalScore, weightedScore, result, allRated } = useMemo(() => computeResult(scores), [scores]);

  const resultConfig = {
    GO: { icon: <CheckCircle size={20} />, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700', label: 'crm.goNogo.resultGo' },
    CONDITIONAL: { icon: <AlertTriangle size={20} />, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700', label: 'crm.goNogo.resultConditional' },
    NO_GO: { icon: <XCircle size={20} />, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700', label: 'crm.goNogo.resultNoGo' },
  };

  const rc = resultConfig[result];

  const categories = ['opportunity', 'win', 'delivery'] as const;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('crm.goNogo.title')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={loading}
            disabled={!allRated}
            onClick={() => onSave({ scores, totalScore, weightedScore, result })}
          >
            {t('crm.goNogo.saveButton')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('crm.goNogo.subtitle')}
        </p>

        {/* Result banner */}
        {allRated ? (
          <div className={cn('flex items-center gap-3 p-4 rounded-lg border', rc.bg)}>
            <span className={rc.color}>{rc.icon}</span>
            <div>
              <p className={cn('text-sm font-bold', rc.color)}>{t(rc.label)}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('crm.goNogo.weightedScore')}: {weightedScore}/100 | {t('crm.goNogo.totalScore')}: {totalScore}/75
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
            <span className="text-neutral-400"><AlertTriangle size={20} /></span>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('crm.goNogo.rateAllHint')}</p>
          </div>
        )}

        {/* Criteria by category */}
        {categories.map((cat) => {
          const catCriteria = CRITERIA.filter((c) => c.category === cat);
          const catSum = catCriteria.reduce((s, c) => s + (scores[c.id] || 0), 0);
          const catMax = catCriteria.length * 5;
          return (
            <div key={cat} className={cn('rounded-lg border p-4', CATEGORY_COLORS[cat])}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {t(CATEGORY_LABELS[cat])} ({Math.round(CATEGORY_WEIGHTS[cat] * 100)}%)
                </h4>
                <span className="text-xs font-medium text-neutral-500 tabular-nums">{catSum}/{catMax}</span>
              </div>
              <div className="space-y-2">
                {catCriteria.map((criterion) => (
                  <div key={criterion.id} className="flex items-center gap-3">
                    <label className="flex-1 text-sm text-neutral-700 dark:text-neutral-300" title={t(CRITERION_HINT_KEYS[criterion.id])}>
                      {t(criterion.labelKey)}
                      <span className="block text-[11px] text-neutral-400 dark:text-neutral-500 font-normal">{t(CRITERION_HINT_KEYS[criterion.id])}</span>
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          title={t(SCORE_LABEL_KEYS[v])}
                          onClick={() => setScores((prev) => ({ ...prev, [criterion.id]: v }))}
                          className={cn(
                            'w-8 h-8 rounded-md text-xs font-semibold transition-all',
                            scores[criterion.id] === v
                              ? v <= 2 ? 'bg-red-500 text-white shadow-sm' : v === 3 ? 'bg-amber-500 text-white shadow-sm' : 'bg-green-500 text-white shadow-sm'
                              : 'bg-white dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-600 hover:border-primary-300 hover:text-primary-600',
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Thresholds legend */}
        <div className="text-xs text-neutral-500 dark:text-neutral-400 flex gap-4">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> ≥73 — GO</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 47–72 — {t('crm.goNogo.resultConditional')}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> &lt;47 — NO GO</span>
        </div>
      </div>
    </Modal>
  );
};

export default GoNoGoScorecardModal;
