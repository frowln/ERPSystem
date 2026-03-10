import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  ShieldCheck,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { analyticsApi } from '@/api/analytics';
import { useProjectOptions } from '@/hooks/useSelectOptions';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReportCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  category: 'PROJECT' | 'FINANCE' | 'SAFETY' | 'OPERATIONS';
  formats: string[];
}

const getCategoryLabels = (): Record<string, string> => ({
  all: t('analytics.reports.categoryAll'),
  project: t('analytics.reports.categoryProject'),
  finance: t('analytics.reports.categoryFinance'),
  safety: t('analytics.reports.categorySafety'),
  operations: t('analytics.reports.categoryOperations'),
});

// ---------------------------------------------------------------------------
// Reports catalog
// ---------------------------------------------------------------------------

const getReports = (): ReportCard[] => [
  {
    id: 'project-summary',
    title: t('analytics.reports.projectSummaryTitle'),
    description: t('analytics.reports.projectSummaryDesc'),
    icon: FileText,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    category: 'PROJECT',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'financial-report',
    title: t('analytics.reports.financialReportTitle'),
    description: t('analytics.reports.financialReportDesc'),
    icon: DollarSign,
    iconColor: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-50 dark:bg-green-900/30',
    category: 'FINANCE',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'safety-report',
    title: t('analytics.reports.safetyReportTitle'),
    description: t('analytics.reports.safetyReportDesc'),
    icon: ShieldCheck,
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-50 dark:bg-orange-900/30',
    category: 'SAFETY',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'daily-log-report',
    title: t('analytics.reports.dailyLogTitle'),
    description: t('analytics.reports.dailyLogDesc'),
    icon: ClipboardList,
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    category: 'OPERATIONS',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'ks2-report',
    title: t('analytics.reports.ks2Title'),
    description: t('analytics.reports.ks2Desc'),
    icon: FileSpreadsheet,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-50 dark:bg-cyan-900/30',
    category: 'FINANCE',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'ks3-report',
    title: t('analytics.reports.ks3Title'),
    description: t('analytics.reports.ks3Desc'),
    icon: FileSpreadsheet,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    iconBg: 'bg-cyan-50 dark:bg-cyan-900/30',
    category: 'FINANCE',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'budget-variance',
    title: t('analytics.reports.budgetVarianceTitle'),
    description: t('analytics.reports.budgetVarianceDesc'),
    icon: BarChart3,
    iconColor: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-50 dark:bg-red-900/30',
    category: 'FINANCE',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'progress-report',
    title: t('analytics.reports.progressReportTitle'),
    description: t('analytics.reports.progressReportDesc'),
    icon: TrendingUp,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-50 dark:bg-indigo-900/30',
    category: 'PROJECT',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'material-consumption',
    title: t('analytics.reports.materialConsumptionTitle'),
    description: t('analytics.reports.materialConsumptionDesc'),
    icon: ClipboardList,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-900/30',
    category: 'OPERATIONS',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'fleet-utilization',
    title: t('analytics.reports.fleetUtilizationTitle'),
    description: t('analytics.reports.fleetUtilizationDesc'),
    icon: BarChart3,
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-50 dark:bg-teal-900/30',
    category: 'OPERATIONS',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  // --- New report types ---
  {
    id: 'evm-report',
    title: t('analytics.reports.evmTitle'),
    description: t('analytics.reports.evmDesc'),
    icon: TrendingUp,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    category: 'FINANCE',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'change-order-report',
    title: t('analytics.reports.changeOrderTitle'),
    description: t('analytics.reports.changeOrderDesc'),
    icon: FileText,
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-50 dark:bg-rose-900/30',
    category: 'FINANCE',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'quality-report',
    title: t('analytics.reports.qualityTitle'),
    description: t('analytics.reports.qualityDesc'),
    icon: ShieldCheck,
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-50 dark:bg-violet-900/30',
    category: 'SAFETY',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'labor-report',
    title: t('analytics.reports.laborTitle'),
    description: t('analytics.reports.laborDesc'),
    icon: ClipboardList,
    iconColor: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-50 dark:bg-sky-900/30',
    category: 'OPERATIONS',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'subcontractor-report',
    title: t('analytics.reports.subcontractorTitle'),
    description: t('analytics.reports.subcontractorDesc'),
    icon: BarChart3,
    iconColor: 'text-lime-600 dark:text-lime-400',
    iconBg: 'bg-lime-50 dark:bg-lime-900/30',
    category: 'OPERATIONS',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
  {
    id: 'rfi-submittal-report',
    title: t('analytics.reports.rfiSubmittalTitle'),
    description: t('analytics.reports.rfiSubmittalDesc'),
    icon: FileText,
    iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
    iconBg: 'bg-fuchsia-50 dark:bg-fuchsia-900/30',
    category: 'PROJECT',
    formats: ['PDF', 'XLSX', 'CSV'],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ReportsPage: React.FC = () => {
  const { options: projectOpts } = useProjectOptions();
  const [category, setCategory] = useState<string>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null);
  const [generating, setGenerating] = useState(false);

  // Modal form state
  const [modalProject, setModalProject] = useState('');
  const [modalDateFrom, setModalDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [modalDateTo, setModalDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [modalFormat, setModalFormat] = useState('pdf');

  const reports = getReports();
  const categoryLabels = getCategoryLabels();
  const filtered = category === 'all' ? reports : reports.filter((r) => r.category.toLowerCase() === category);

  const handleGenerate = (report: ReportCard) => {
    setSelectedReport(report);
    setModalFormat((report.formats[0] ?? 'PDF').toLowerCase());
    setShowGenerateModal(true);
  };

  const handleSubmitGenerate = async () => {
    if (!selectedReport) return;
    setGenerating(true);
    try {
      const blob = await analyticsApi.exportReport(selectedReport.id, {
        projectId: modalProject || undefined,
        dateFrom: modalDateFrom,
        dateTo: modalDateTo,
        format: modalFormat,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport.id}-report.${modalFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      setShowGenerateModal(false);
      toast.success(t('analytics.reports.toastSuccess'));
    } catch {
      toast.error(t('analytics.reports.toastError'));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('analytics.reports.title')}
        subtitle={t('analytics.reports.subtitle')}
        breadcrumbs={[{ label: t('common.home'), href: '/' }, { label: t('analytics.dashboard.title'), href: '/analytics' }, { label: t('analytics.reports.title') }]}
      />

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-6">
        {Object.entries(categoryLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              category === key ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Report cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 hover:shadow-sm transition-shadow flex flex-col"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', report.iconBg)}>
                  <Icon size={20} className={report.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{report.title}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">{report.description}</p>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {report.formats.map((fmt) => (
                    <span key={fmt} className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                      {fmt}
                    </span>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  size="xs"
                  iconLeft={<Download size={13} />}
                  onClick={() => handleGenerate(report)}
                >
                  {t('analytics.reports.generate')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate modal */}
      <Modal
        open={showGenerateModal}
        onClose={() => { setShowGenerateModal(false); setGenerating(false); }}
        title={`${t('analytics.reports.generating')}: ${selectedReport?.title ?? ''}`}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowGenerateModal(false); setGenerating(false); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitGenerate} loading={generating}>
              {generating ? t('analytics.reports.generatingProgress') : t('analytics.reports.generate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('analytics.reports.project')}>
            <Select
              value={modalProject}
              onChange={(e) => setModalProject(e.target.value)}
              options={[
                { value: '', label: t('analytics.reports.allProjects') },
                ...projectOpts,
              ]}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('analytics.reports.dateFrom')}>
              <Input type="date" value={modalDateFrom} onChange={(e) => setModalDateFrom(e.target.value)} />
            </FormField>
            <FormField label={t('analytics.reports.dateTo')}>
              <Input type="date" value={modalDateTo} onChange={(e) => setModalDateTo(e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('analytics.reports.format')}>
            <Select
              value={modalFormat}
              onChange={(e) => setModalFormat(e.target.value)}
              options={(selectedReport?.formats ?? ['PDF']).map((f) => ({ value: f.toLowerCase(), label: f }))}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default ReportsPage;
