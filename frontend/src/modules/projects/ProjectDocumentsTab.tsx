import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CreditCard, Calendar } from 'lucide-react';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { formatMoneyCompact, formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { Project } from '@/types';

type ProjectContractSnapshot = {
  id: string;
  number: string;
  name: string;
  projectId: string;
  partnerName: string;
  status: 'ACTIVE' | 'SIGNED' | 'ON_APPROVAL' | 'CLOSED';
  totalWithVat: number;
  totalInvoiced: number;
  totalPaid: number;
  plannedEndDate: string;
};

interface Props {
  project: Project | undefined;
}

export const ProjectDocumentsTab: React.FC<Props> = ({ project: p }) => {
  const navigate = useNavigate();
  const projectContracts: ProjectContractSnapshot[] = [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={<FileText size={18} />} label={t('projects.documentsTab.contracts')} value={String(projectContracts.length)} />
        <MetricCard icon={<CreditCard size={18} />} label={t('projects.documentsTab.ks2ks3')} value="18 / 14" />
        <MetricCard icon={<Calendar size={18} />} label={t('projects.documentsTab.lastUpdate')} value={formatDate(p?.updatedAt ?? '')} />
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('projects.documentsTab.relatedContracts')}</h3>
          <Button variant="secondary" size="sm" onClick={() => navigate('/contracts')}>{t('projects.documentsTab.openContractRegistry')}</Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.documentsTab.headerNumber')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.documentsTab.headerContract')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.documentsTab.headerCounterparty')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.documentsTab.headerAmount')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.documentsTab.headerDeadline')}</th>
            </tr>
          </thead>
          <tbody>
            {projectContracts.map((contract) => (
              <tr key={contract.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <td className="px-5 py-3 text-xs font-mono text-neutral-500 dark:text-neutral-400">{contract.number}</td>
                <td className="px-5 py-3 text-sm text-neutral-800 dark:text-neutral-200">{contract.name}</td>
                <td className="px-5 py-3 text-sm text-neutral-600">{contract.partnerName}</td>
                <td className="px-5 py-3 text-sm font-medium tabular-nums">{formatMoneyCompact(contract.totalWithVat)}</td>
                <td className="px-5 py-3 text-sm tabular-nums text-neutral-500 dark:text-neutral-400">{formatDate(contract.plannedEndDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
