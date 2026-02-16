import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Hash,
  TrendingUp,
  TrendingDown,
  Calendar,
  Edit,
  Trash2,
  Link2,
  FileText,
  DollarSign,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { costManagementApi } from '@/api/costManagement';
import { formatMoney, formatPercent, formatDateLong } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface CostCode {
  id: string;
  code: string;
  name: string;
  parentCode: string | null;
  parentName: string | null;
  hierarchyPath: string;
  budget: number;
  actual: number;
  committed: number;
  forecast: number;
  variance: number;
  variancePercent: number;
  projectName: string;
  createdAt: string;
  updatedAt: string;
}

interface LinkedCommitment {
  id: string;
  number: string;
  vendor: string;
  amount: number;
  status: string;
}

const commitmentStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  draft: 'gray',
  pending: 'yellow',
  approved: 'blue',
  committed: 'green',
  closed: 'purple',
  void: 'gray',
};

const getCommitmentStatusLabels = (): Record<string, string> => ({
  draft: t('costManagement.costCodeDetail.statusDraft'),
  pending: t('costManagement.costCodeDetail.statusPending'),
  approved: t('costManagement.costCodeDetail.statusApproved'),
  committed: t('costManagement.costCodeDetail.statusCommitted'),
  closed: t('costManagement.costCodeDetail.statusClosed'),
  void: t('costManagement.costCodeDetail.statusVoid'),
});

const CostCodeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();

  const { data: costCodeData } = useQuery({
    queryKey: ['cost-code', id],
    queryFn: () => costManagementApi.getCostCode(id!),
    enabled: !!id,
  });

  if (!costCodeData) return null;

  const cc: CostCode = {
    id: costCodeData.id,
    code: costCodeData.code,
    name: costCodeData.name,
    parentCode: (costCodeData as any).parentCode ?? null,
    parentName: (costCodeData as any).parentName ?? null,
    hierarchyPath: (costCodeData as any).hierarchyPath ?? `${costCodeData.code} ${costCodeData.name}`,
    budget: costCodeData.budgetAmount ?? 0,
    actual: costCodeData.actualAmount ?? 0,
    committed: costCodeData.committedAmount ?? 0,
    forecast: costCodeData.forecastAmount ?? 0,
    variance: costCodeData.varianceAmount ?? 0,
    variancePercent: costCodeData.variancePercent ?? 0,
    projectName: (costCodeData as any).projectName ?? '',
    createdAt: (costCodeData as any).createdAt ?? '',
    updatedAt: (costCodeData as any).updatedAt ?? '',
  };
  const linkedCommitments: LinkedCommitment[] = (costCodeData as any)?.commitments ?? [];
  const budgetUsedPercent = (cc.actual / cc.budget) * 100;
  const isOverBudget = cc.variance < 0;

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: t('costManagement.costCodeDetail.deleteTitle'),
      description: t('costManagement.costCodeDetail.deleteDescription'),
      confirmLabel: t('costManagement.costCodeDetail.deleteConfirm'),
      cancelLabel: t('costManagement.costCodeDetail.deleteCancel'),
      items: [`${cc.code} ${cc.name}`],
    });
    if (!isConfirmed) return;

    toast.success(t('costManagement.costCodeDetail.deleteSuccess'));
    navigate('/cost-management/codes');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${cc.code} ${cc.name}`}
        subtitle={cc.projectName}
        backTo="/cost-management/codes"
        breadcrumbs={[
          { label: t('costManagement.costCodeDetail.breadcrumbHome'), href: '/' },
          { label: t('costManagement.costCodeDetail.breadcrumbCostCodes'), href: '/cost-management/codes' },
          { label: cc.code },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast(t('costManagement.costCodeDetail.editAvailableInList'));
                navigate('/cost-management/codes');
              }}
            >
              {t('costManagement.costCodeDetail.edit')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              onClick={handleDelete}
            >
              {t('costManagement.costCodeDetail.delete')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Hierarchy path */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
              <Hash size={16} className="text-primary-500" />
              {t('costManagement.costCodeDetail.hierarchy')}
            </h3>
            <p className="text-sm text-neutral-600 bg-neutral-50 dark:bg-neutral-800 p-3 rounded-lg">{cc.hierarchyPath}</p>
          </div>

          {/* Budget vs Actual */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-primary-500" />
              {t('costManagement.costCodeDetail.budgetVsActual')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.costCodeDetail.budget')}</p>
                <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{formatMoney(cc.budget)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.costCodeDetail.actual')}</p>
                <p className="text-lg font-bold text-primary-600">{formatMoney(cc.actual)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.costCodeDetail.commitments')}</p>
                <p className="text-lg font-bold text-warning-600">{formatMoney(cc.committed)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.costCodeDetail.forecast')}</p>
                <p className="text-lg font-bold text-neutral-700 dark:text-neutral-300">{formatMoney(cc.forecast)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">{t('costManagement.costCodeDetail.budgetUtilization')}</span>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{formatPercent(budgetUsedPercent)}</span>
              </div>
              <div className="w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${budgetUsedPercent > 90 ? 'bg-danger-500' : budgetUsedPercent > 75 ? 'bg-warning-500' : 'bg-success-500'}`}
                  style={{ width: `${Math.min(budgetUsedPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Variance analysis */}
          <div className={`rounded-xl border p-6 ${isOverBudget ? 'bg-danger-50 border-danger-200' : 'bg-success-50 border-success-200'}`}>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              {isOverBudget ? <TrendingDown size={16} className="text-danger-500" /> : <TrendingUp size={16} className="text-success-500" />}
              {t('costManagement.costCodeDetail.varianceAnalysis')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.costCodeDetail.variance')}</p>
                <p className={`text-2xl font-bold ${isOverBudget ? 'text-danger-700' : 'text-success-700'}`}>
                  {isOverBudget ? '' : '+'}{formatMoney(cc.variance)}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('costManagement.costCodeDetail.variancePercent')}</p>
                <p className={`text-2xl font-bold ${isOverBudget ? 'text-danger-700' : 'text-success-700'}`}>
                  {isOverBudget ? '' : '+'}{formatPercent(cc.variancePercent)}
                </p>
              </div>
            </div>
          </div>

          {/* Linked commitments */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Link2 size={15} />
              {t('costManagement.costCodeDetail.linkedCommitments')} ({linkedCommitments.length})
            </h3>
            <div className="space-y-2">
              {linkedCommitments.map((cmt) => (
                <div key={cmt.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/cost-management/commitments/${cmt.id}`)}>
                  <div>
                    <p className="text-sm font-medium text-primary-600">{cmt.number}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{cmt.vendor}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatMoney(cmt.amount)}</p>
                    <StatusBadge status={cmt.status} colorMap={commitmentStatusColorMap} label={getCommitmentStatusLabels()[cmt.status] ?? cmt.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('costManagement.costCodeDetail.details')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Hash size={15} />} label={t('costManagement.costCodeDetail.code')} value={cc.code} />
              <InfoItem icon={<FileText size={15} />} label={t('costManagement.costCodeDetail.name')} value={cc.name} />
              <InfoItem icon={<Hash size={15} />} label={t('costManagement.costCodeDetail.parentCode')} value={cc.parentCode ?? t('costManagement.costCodeDetail.rootCode')} />
              <InfoItem icon={<Calendar size={15} />} label={t('costManagement.costCodeDetail.created')} value={formatDateLong(cc.createdAt)} />
              <InfoItem icon={<Calendar size={15} />} label={t('costManagement.costCodeDetail.updated')} value={formatDateLong(cc.updatedAt)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default CostCodeDetailPage;
