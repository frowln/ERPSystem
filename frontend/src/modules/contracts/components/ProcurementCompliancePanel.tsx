import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { contractsApi } from '@/api/contracts';
import { t } from '@/i18n';

interface ProcurementCompliancePanelProps {
  contractId: string;
  procurementLaw?: '44-FZ' | '223-FZ' | 'COMMERCIAL';
}

const lawBadgeCls: Record<string, string> = {
  '44-FZ': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  '223-FZ': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  COMMERCIAL: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const lawLabels: Record<string, string> = {
  '44-FZ': 'contracts.procurement.44fz',
  '223-FZ': 'contracts.procurement.223fz',
  COMMERCIAL: 'contracts.procurement.commercial',
};

const ProcurementCompliancePanel: React.FC<ProcurementCompliancePanelProps> = ({
  contractId,
  procurementLaw,
}) => {
  const { data: compliance, isLoading } = useQuery({
    queryKey: ['procurement-compliance', contractId],
    queryFn: () => contractsApi.validateProcurementCompliance(contractId),
    enabled: !!contractId && procurementLaw !== 'COMMERCIAL',
  });

  if (!procurementLaw || procurementLaw === 'COMMERCIAL') return null;

  const docKeys = procurementLaw === '44-FZ'
    ? Object.entries((t as any)('contracts.procurement.docs44fz') || {})
    : Object.entries((t as any)('contracts.procurement.docs223fz') || {});

  // Use API data if available, otherwise show static checklist
  const checklist = compliance?.checklist;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('contracts.procurement.compliancePanel')}
        </h3>
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${lawBadgeCls[procurementLaw] ?? ''}`}>
          {t(lawLabels[procurementLaw] ?? procurementLaw)}
        </span>
      </div>

      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
        {t('contracts.procurement.complianceHint')}
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
          ))}
        </div>
      ) : checklist ? (
        <div className="space-y-2">
          {checklist.map((item) => (
            <div
              key={item.code}
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-neutral-100 dark:border-neutral-800"
            >
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{item.name}</span>
              {item.provided ? (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('contracts.procurement.docProvided')}
                </span>
              ) : item.required ? (
                <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                  <XCircle className="w-3.5 h-3.5" />
                  {t('contracts.procurement.docMissing')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-neutral-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {t('contracts.procurement.docRequired')}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Static checklist from i18n keys */
        <div className="space-y-2">
          {(procurementLaw === '44-FZ'
            ? ['nmck', 'tz', 'protocol', 'notice', 'contract', 'guarantee']
            : ['regulation', 'protocol', 'notice', 'criteria']
          ).map((key) => {
            const docKey = procurementLaw === '44-FZ'
              ? `contracts.procurement.docs44fz.${key}`
              : `contracts.procurement.docs223fz.${key}`;
            return (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-neutral-100 dark:border-neutral-800"
              >
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{t(docKey)}</span>
                <span className="flex items-center gap-1 text-xs font-medium text-neutral-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {t('contracts.procurement.docRequired')}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProcurementCompliancePanel;
