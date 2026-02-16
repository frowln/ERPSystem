import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardCheck,
  User,
  Calendar,
  Clock,
  Camera,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Link2,
  FileText,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { formatDateLong, formatDateTime } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import { qualityApi } from '@/api/quality';

const qualityCheckStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  planned: 'gray',
  in_progress: 'blue',
  passed: 'green',
  failed: 'red',
  conditionally_passed: 'yellow',
  cancelled: 'gray',
};

const getQualityCheckStatusLabels = (): Record<string, string> => ({
  planned: t('quality.checkDetail.statusPlanned'),
  in_progress: t('quality.checkDetail.statusInProgress'),
  passed: t('quality.checkDetail.statusPassed'),
  failed: t('quality.checkDetail.statusFailed'),
  conditionally_passed: t('quality.checkDetail.statusConditionallyPassed'),
  cancelled: t('quality.checkDetail.statusCancelled'),
});

const getQualityCheckTypeLabels = (): Record<string, string> => ({
  incoming: t('quality.checkDetail.typeIncoming'),
  process: t('quality.checkDetail.typeProcess'),
  acceptance: t('quality.checkDetail.typeAcceptance'),
  hidden_works: t('quality.checkDetail.typeHiddenWorks'),
  laboratory: t('quality.checkDetail.typeLaboratory'),
});

interface QualityCheck {
  id: string;
  number: string;
  type: string;
  status: string;
  result: string;
  inspectorId: string;
  inspectorName: string;
  projectName: string;
  location: string;
  scheduledDate: string;
  completedDate: string | null;
  description: string;
  findings: string[];
  correctiveActions: string[];
  linkedIssueIds: string[];
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}


const getStatusActions = (): Record<string, { label: string; target: string }[]> => ({
  planned: [{ label: t('quality.checkDetail.actionStartCheck'), target: 'IN_PROGRESS' }],
  in_progress: [
    { label: t('quality.checkDetail.actionPassed'), target: 'PASSED' },
    { label: t('quality.checkDetail.actionFailed'), target: 'FAILED' },
    { label: t('quality.checkDetail.actionConditionallyPassed'), target: 'CONDITIONALLY_PASSED' },
  ],
  failed: [{ label: t('quality.checkDetail.actionScheduleRecheck'), target: 'PLANNED' }],
  conditionally_passed: [{ label: t('quality.checkDetail.actionConfirmPass'), target: 'PASSED' }],
});

const QualityCheckDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();

  const { data: rawCheck, isLoading: checkLoading } = useQuery({
    queryKey: ['quality-check', id],
    queryFn: () => qualityApi.getCheck(id!),
    enabled: !!id,
  });

  if (checkLoading || !rawCheck) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">{t('common.loading')}</div>;
  }

  const qc: QualityCheck = {
    id: rawCheck.id,
    number: rawCheck.number,
    type: rawCheck.type,
    status: rawCheck.status,
    result: rawCheck.result,
    inspectorId: (rawCheck as any).inspectorId ?? '',
    inspectorName: rawCheck.inspectorName,
    projectName: rawCheck.projectName,
    location: (rawCheck as any).location ?? '',
    scheduledDate: rawCheck.scheduledDate,
    completedDate: rawCheck.completedDate ?? null,
    description: rawCheck.description,
    findings: (rawCheck as any).findings ?? [],
    correctiveActions: (rawCheck as any).correctiveActions ?? [],
    linkedIssueIds: (rawCheck as any).linkedIssueIds ?? [],
    photoCount: (rawCheck as any).photoCount ?? 0,
    createdAt: rawCheck.createdAt,
    updatedAt: (rawCheck as any).updatedAt ?? rawCheck.createdAt,
  };
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const effectiveStatus = statusOverride ?? qc.status;
  const statusActions = getStatusActions();
  const actions = useMemo(() => statusActions[effectiveStatus] ?? [], [effectiveStatus]);

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: t('quality.checkDetail.confirmDeleteTitle'),
      description: t('quality.checkDetail.confirmDeleteDescription'),
      confirmLabel: t('quality.checkDetail.confirmDeleteBtn'),
      cancelLabel: t('quality.checkDetail.confirmCancelBtn'),
      items: [qc.number],
    });
    if (!isConfirmed) return;

    toast.success(t('quality.checkDetail.toastDeleted'));
    navigate('/quality');
  };

  const qualityCheckStatusLabels = getQualityCheckStatusLabels();
  const qualityCheckTypeLabels = getQualityCheckTypeLabels();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={qc.number}
        subtitle={`${qc.projectName} / ${qualityCheckTypeLabels[qc.type] ?? qc.type}`}
        backTo="/quality"
        breadcrumbs={[
          { label: t('quality.checkDetail.breadcrumbHome'), href: '/' },
          { label: t('quality.checkDetail.breadcrumbQuality'), href: '/quality' },
          { label: qc.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={qualityCheckStatusColorMap} label={qualityCheckStatusLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            {actions.map((a) => (
              <Button
                key={a.target}
                variant={a.target === 'PASSED' ? 'success' : a.target === 'FAILED' ? 'danger' : 'secondary'}
                size="sm"
                onClick={() => {
                  setStatusOverride(a.target);
                  toast.success(t('quality.checkDetail.toastStatusChanged', { status: qualityCheckStatusLabels[a.target] ?? a.target }));
                }}
              >
                {a.label}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast(t('quality.checkDetail.toastEditHint'));
                navigate('/quality');
              }}
            >
              {t('quality.checkDetail.btnEdit')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              iconLeft={<Trash2 size={14} />}
              onClick={handleDelete}
            >
              {t('quality.checkDetail.btnDelete')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-primary-500" />
              {t('quality.checkDetail.sectionDescription')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{qc?.description}</p>
          </div>

          {/* Findings */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning-500" />
              {t('quality.checkDetail.sectionFindings', { count: String(qc?.findings?.length ?? 0) })}
            </h3>
            <div className="space-y-2">
              {qc?.findings?.map((finding, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-warning-50 rounded-lg border border-warning-200">
                  <XCircle size={16} className="text-warning-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-warning-800">{finding}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Corrective actions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-success-500" />
              {t('quality.checkDetail.sectionCorrectiveActions', { count: String(qc?.correctiveActions?.length ?? 0) })}
            </h3>
            <div className="space-y-2">
              {qc?.correctiveActions?.map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-success-50 rounded-lg border border-success-200">
                  <CheckCircle2 size={16} className="text-success-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-success-800">{action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Photos placeholder */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Camera size={16} className="text-primary-500" />
              {t('quality.checkDetail.sectionPhotos', { count: String(qc?.photoCount ?? 0) })}
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: qc?.photoCount ?? 0 }).map((_, idx) => (
                <div key={idx} className="aspect-square bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
                  <Camera size={24} className="text-neutral-300" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('quality.checkDetail.sectionDetails')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<User size={15} />} label={t('quality.checkDetail.labelInspector')} value={qc?.inspectorName ?? ''} />
              <InfoItem icon={<ClipboardCheck size={15} />} label={t('quality.checkDetail.labelCheckType')} value={qualityCheckTypeLabels[qc.type] ?? qc.type} />
              <InfoItem icon={<FileText size={15} />} label={t('quality.checkDetail.labelObject')} value={qc.location} />
              <InfoItem icon={<Calendar size={15} />} label={t('quality.checkDetail.labelScheduledDate')} value={formatDateLong(qc.scheduledDate)} />
              <InfoItem icon={<Calendar size={15} />} label={t('quality.checkDetail.labelCompletedDate')} value={qc.completedDate ? formatDateLong(qc.completedDate) : '---'} />
              <InfoItem icon={<Clock size={15} />} label={t('quality.checkDetail.labelCreated')} value={formatDateLong(qc.createdAt)} />
            </div>
          </div>

          {/* Result */}
          <div className={`rounded-xl border p-6 ${qc.status === 'FAILED' ? 'bg-danger-50 border-danger-200' : qc.status === 'PASSED' ? 'bg-success-50 border-success-200' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700'}`}>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('quality.checkDetail.sectionResult')}</h3>
            <p className={`text-lg font-bold ${qc.status === 'FAILED' ? 'text-danger-700' : qc.status === 'PASSED' ? 'text-success-700' : 'text-neutral-700 dark:text-neutral-300'}`}>
              {qc.result}
            </p>
          </div>

          {/* Linked issues */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Link2 size={15} />
              {t('quality.checkDetail.sectionLinkedIssues')}
            </h3>
            <div className="space-y-2">
              {qc.linkedIssueIds.map((issueId) => (
                <div key={issueId} className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate(`/pm/issues/${issueId}`)}>
                  <AlertTriangle size={15} className="text-neutral-400" />
                  <span className="text-sm text-primary-600">{issueId}</span>
                </div>
              ))}
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

export default QualityCheckDetailPage;
