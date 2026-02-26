import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Package,
  Receipt,
  Search,
} from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { financeApi } from '@/api/finance';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ThreeWayMatchResult, InvoiceMatchCandidate } from '@/types';

// ---------------------------------------------------------------------------
// 3-Way Match Status Card
// ---------------------------------------------------------------------------
const ThreeWayMatchCard: React.FC<{ invoiceId: string }> = ({ invoiceId }) => {
  const { data: result, isLoading } = useQuery<ThreeWayMatchResult>({
    queryKey: ['three-way-match', invoiceId],
    queryFn: () => financeApi.validateThreeWayMatch(invoiceId),
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto" />
      </div>
    );
  }

  if (!result) return null;

  const confidenceColor =
    result.overallConfidence >= 80
      ? 'text-success-600 dark:text-success-400'
      : result.overallConfidence >= 50
        ? 'text-warning-600 dark:text-warning-400'
        : 'text-danger-600 dark:text-danger-400';

  const confidenceBg =
    result.overallConfidence >= 80
      ? 'bg-success-50 dark:bg-success-900/20'
      : result.overallConfidence >= 50
        ? 'bg-warning-50 dark:bg-warning-900/20'
        : 'bg-danger-50 dark:bg-danger-900/20';

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
        <CheckCircle2 size={16} className="text-primary-500" />
        {t('invoiceMatching.threeWayTitle')}
      </h3>

      {/* Confidence score */}
      <div className={cn('rounded-lg p-4 mb-4', confidenceBg)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('invoiceMatching.confidence')}
          </span>
          <span className={cn('text-2xl font-bold', confidenceColor)}>
            {result.overallConfidence.toFixed(0)}%
          </span>
        </div>
        <div className="mt-2 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              result.overallConfidence >= 80
                ? 'bg-success-500'
                : result.overallConfidence >= 50
                  ? 'bg-warning-500'
                  : 'bg-danger-500',
            )}
            style={{ width: `${result.overallConfidence}%` }}
          />
        </div>
      </div>

      {/* Three columns: PO, Receipt, Invoice */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MatchColumn
          icon={<FileText size={16} />}
          label={t('invoiceMatching.contract')}
          matched={result.hasPurchaseOrder}
        />
        <MatchColumn
          icon={<Package size={16} />}
          label={t('invoiceMatching.receipt')}
          matched={result.hasReceipt}
        />
        <MatchColumn
          icon={<Receipt size={16} />}
          label={t('invoiceMatching.linesMatch')}
          matched={result.linesMatchTotal}
        />
      </div>

      {/* Discrepancies */}
      {result.discrepancies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t('invoiceMatching.discrepancies')}
          </h4>
          {result.discrepancies.map((d, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 bg-danger-50 dark:bg-danger-900/10 rounded-lg border border-danger-100 dark:border-danger-900/30"
            >
              <AlertTriangle size={14} className="text-danger-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-danger-700 dark:text-danger-300">
                  {d.description}
                </p>
                {d.difference != null && (
                  <p className="text-xs text-danger-600 dark:text-danger-400 mt-0.5">
                    {t('invoiceMatching.difference')}: {formatMoney(d.difference)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MatchColumn: React.FC<{
  icon: React.ReactNode;
  label: string;
  matched: boolean;
}> = ({ icon, label, matched }) => (
  <div
    className={cn(
      'flex flex-col items-center gap-1.5 p-3 rounded-lg border',
      matched
        ? 'bg-success-50 dark:bg-success-900/10 border-success-200 dark:border-success-900/30'
        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700',
    )}
  >
    <span className={matched ? 'text-success-500' : 'text-neutral-400'}>{icon}</span>
    <span className="text-xs text-center text-neutral-700 dark:text-neutral-300">{label}</span>
    {matched ? (
      <CheckCircle2 size={14} className="text-success-500" />
    ) : (
      <XCircle size={14} className="text-neutral-400" />
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Fuzzy Match Panel
// ---------------------------------------------------------------------------
const FuzzyMatchPanel: React.FC<{ invoiceId: string }> = ({ invoiceId }) => {
  const [budgetId, setBudgetId] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);
  const queryClient = useQueryClient();

  const { data: candidates, isLoading } = useQuery<InvoiceMatchCandidate[]>({
    queryKey: ['invoice-match', invoiceId, budgetId],
    queryFn: () => financeApi.matchInvoiceToPositions(invoiceId, budgetId),
    enabled: searchTriggered && !!budgetId,
  });

  const linkMutation = useMutation({
    mutationFn: ({ lineId, budgetItemId }: { lineId: string; budgetItemId: string }) =>
      financeApi.linkInvoiceLine(invoiceId, lineId, budgetItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['INVOICE_LINES', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['INVOICE', invoiceId] });
      // maybe also invalidate three-way-match
      queryClient.invalidateQueries({ queryKey: ['three-way-match', invoiceId] });
    },
  });

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
      <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
        <Search size={16} className="text-primary-500" />
        {t('invoiceMatching.fuzzyTitle')}
      </h3>

      <div className="flex items-end gap-3 mb-4">
        <FormField label={t('invoiceMatching.budgetId')} className="flex-1">
          <Input
            value={budgetId}
            onChange={(e) => {
              setBudgetId(e.target.value);
              setSearchTriggered(false);
            }}
            placeholder={t('invoiceMatching.budgetIdPlaceholder')}
          />
        </FormField>
        <Button
          variant="primary"
          size="sm"
          loading={isLoading}
          disabled={!budgetId}
          onClick={() => setSearchTriggered(true)}
        >
          {t('invoiceMatching.search')}
        </Button>
      </div>

      {candidates && candidates.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {t('invoiceMatching.colInvoiceLine')}
                </th>
                <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {t('invoiceMatching.colBudgetItem')}
                </th>
                <th className="text-center px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {t('invoiceMatching.colConfidence')}
                </th>
                <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {t('invoiceMatching.colDescription')}
                </th>
                <th className="text-right px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <tr
                  key={i}
                  className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-3 py-2.5 text-neutral-900 dark:text-neutral-100">
                    {c.invoiceLineName}
                  </td>
                  <td className="px-3 py-2.5 text-neutral-700 dark:text-neutral-300">
                    {c.budgetItemName}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <ConfidenceBadge confidence={c.confidence} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {c.matchDescription}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button
                      variant="primary"
                      size="xs"
                      loading={linkMutation.isPending && linkMutation.variables?.lineId === c.invoiceLineId && linkMutation.variables?.budgetItemId === c.budgetItemId}
                      onClick={() => linkMutation.mutate({ lineId: c.invoiceLineId, budgetItemId: c.budgetItemId })}
                    >
                      {t('invoiceMatching.link')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {candidates && candidates.length === 0 && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
          {t('invoiceMatching.noMatches')}
        </p>
      )}
    </div>
  );
};

const ConfidenceBadge: React.FC<{ confidence: number }> = ({ confidence }) => {
  const color =
    confidence >= 70
      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
      : confidence >= 50
        ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300'
        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400';

  return (
    <span className={cn('inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full', color)}>
      {confidence}%
    </span>
  );
};

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------
interface InvoiceMatchingPanelProps {
  invoiceId: string;
}

const InvoiceMatchingPanel: React.FC<InvoiceMatchingPanelProps> = ({ invoiceId }) => {
  return (
    <div className="space-y-6">
      <ThreeWayMatchCard invoiceId={invoiceId} />
      <FuzzyMatchPanel invoiceId={invoiceId} />
    </div>
  );
};

export default InvoiceMatchingPanel;
