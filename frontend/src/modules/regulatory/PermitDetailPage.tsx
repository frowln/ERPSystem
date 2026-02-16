import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Building2,
  User,
  Calendar,
  Clock,
  FileText,
  Link2,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { useConfirmDialog } from '@/design-system/components/ConfirmDialog/provider';
import {
  StatusBadge,
  permitStatusColorMap,
  permitStatusLabels,
  permitTypeColorMap,
  permitTypeLabels,
} from '@/design-system/components/StatusBadge';
import { formatDateLong, formatDate } from '@/lib/format';
import toast from 'react-hot-toast';
import { regulatoryApi } from '@/api/regulatory';
import { t } from '@/i18n';

interface LinkedInspection {
  id: string;
  type: string;
  date: string;
  status: string;
  result: string;
}

interface LinkedDocument {
  id: string;
  name: string;
  type: string;
}

const inspectionStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'cyan'> = {
  scheduled: 'blue',
  in_progress: 'yellow',
  passed: 'green',
  failed: 'red',
  cancelled: 'gray',
};

const getInspectionStatusLabels = (): Record<string, string> => ({
  scheduled: t('regulatory.inspStatusScheduled'),
  in_progress: t('regulatory.inspStatusInProgress'),
  passed: t('regulatory.inspStatusPassed'),
  failed: t('regulatory.inspStatusFailed'),
  cancelled: t('regulatory.inspStatusCancelled'),
});

const getStatusActions = (): Record<string, { label: string; target: string }[]> => ({
  draft: [{ label: t('regulatory.actionSubmit'), target: 'SUBMITTED' }],
  submitted: [{ label: t('regulatory.actionUnderReview'), target: 'UNDER_REVIEW' }],
  under_review: [
    { label: t('regulatory.actionApprove'), target: 'APPROVED' },
    { label: t('regulatory.actionReject'), target: 'REJECTED' },
  ],
  approved: [{ label: t('regulatory.actionActivate'), target: 'ACTIVE' }],
});

const PermitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();

  const { data: permit, isLoading } = useQuery({
    queryKey: ['PERMIT', id],
    queryFn: () => regulatoryApi.getPermit(id!),
    enabled: !!id,
  });

  if (isLoading || !permit) {
    return <div className="animate-fade-in p-8 text-center text-neutral-500 dark:text-neutral-400">{t('regulatory.loadingText')}</div>;
  }

  const linkedInspections: LinkedInspection[] = [];
  const linkedDocuments: LinkedDocument[] = [];

  const p = {
    id: permit.id,
    number: permit.number,
    type: permit.permitType,
    status: permit.status,
    issuingAuthority: permit.issuedBy,
    issuedDate: permit.issuedDate ?? '',
    expiryDate: permit.validUntil ?? '',
    conditions: permit.conditions ? permit.conditions.split(';').map(s => s.trim()).filter(Boolean) : [],
    projectName: permit.projectName ?? '',
    description: permit.notes ?? '',
    responsibleName: permit.responsibleName,
    contactPerson: '',
    contactPhone: '',
    createdAt: permit.createdAt,
    updatedAt: permit.updatedAt,
  };
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const effectiveStatus = statusOverride ?? p.status;
  const actions = useMemo(() => getStatusActions()[effectiveStatus] ?? [], [effectiveStatus]);

  // Check if permit is expiring soon (within 90 days)
  const expiryDate = new Date(p.expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 90;

  const handleStatusChange = (targetStatus: string) => {
    setStatusOverride(targetStatus);
    toast.success(t('regulatory.statusChanged', { status: permitStatusLabels[targetStatus] ?? targetStatus }));
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: t('regulatory.deletePermitTitle'),
      description: t('regulatory.deletePermitDesc'),
      confirmLabel: t('regulatory.deletePermitConfirm'),
      cancelLabel: t('regulatory.deletePermitCancel'),
      items: [p.number],
    });
    if (!isConfirmed) return;

    toast.success(t('regulatory.permitDeleted'));
    navigate('/regulatory/permits');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={p.number}
        subtitle={`${p.projectName} / ${permitTypeLabels[p.type] ?? p.type}`}
        backTo="/regulatory/permits"
        breadcrumbs={[
          { label: t('regulatory.breadcrumbHome'), href: '/' },
          { label: t('regulatory.btnPermits'), href: '/regulatory/permits' },
          { label: p.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={effectiveStatus} colorMap={permitStatusColorMap} label={permitStatusLabels[effectiveStatus] ?? effectiveStatus} size="md" />
            <StatusBadge status={p.type} colorMap={permitTypeColorMap} label={permitTypeLabels[p.type] ?? p.type} size="md" />
            {actions.map((a) => (
              <Button key={a.target} variant="secondary" size="sm" onClick={() => handleStatusChange(a.target)}>{a.label}</Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit size={14} />}
              onClick={() => {
                toast(t('regulatory.editToast'));
                navigate('/regulatory/permits');
              }}
            >
              {t('regulatory.btnEdit')}
            </Button>
            <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={handleDelete}>{t('regulatory.btnDelete')}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-primary-500" />
              {t('regulatory.sectionDescription')}
            </h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{p.description}</p>
          </div>

          {/* Conditions */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning-500" />
              {t('regulatory.sectionConditions', { count: String(p.conditions.length) })}
            </h3>
            <div className="space-y-2">
              {p.conditions.map((condition, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <span className="text-xs font-bold text-primary-600 mt-0.5 flex-shrink-0">{idx + 1}.</span>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{condition}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Linked inspections */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-primary-500" />
              {t('regulatory.sectionLinkedInspections', { count: String(linkedInspections.length) })}
            </h3>
            <div className="space-y-2">
              {linkedInspections.map((insp) => (
                <div key={insp.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors" onClick={() => navigate('/regulatory/inspections')}>
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{insp.type}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{formatDate(insp.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{insp.result}</span>
                    <StatusBadge status={insp.status} colorMap={inspectionStatusColorMap} label={getInspectionStatusLabels()[insp.status] ?? insp.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linked documents */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Link2 size={15} />
              {t('regulatory.sectionLinkedDocuments', { count: String(linkedDocuments.length) })}
            </h3>
            <div className="space-y-2">
              {linkedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <FileText size={15} className="text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{doc.name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{doc.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('regulatory.sectionDetails')}</h3>
            <div className="space-y-4">
              <InfoItem icon={<Building2 size={15} />} label={t('regulatory.labelIssuingAuthority')} value={p.issuingAuthority} />
              <InfoItem icon={<Calendar size={15} />} label={t('regulatory.labelIssuedDate')} value={formatDateLong(p.issuedDate)} />
              <InfoItem icon={<Calendar size={15} />} label={t('regulatory.labelValidUntil')} value={formatDateLong(p.expiryDate)} />
              <InfoItem icon={<User size={15} />} label={t('regulatory.labelResponsible')} value={p.responsibleName} />
              <InfoItem icon={<User size={15} />} label={t('regulatory.labelContactPerson')} value={p.contactPerson} />
              <InfoItem icon={<Clock size={15} />} label={t('regulatory.labelPhone')} value={p.contactPhone} />
            </div>
          </div>

          {/* Expiry warning */}
          {isExpiringSoon && (
            <div className="bg-warning-50 rounded-xl border border-warning-200 p-6">
              <h3 className="text-sm font-semibold text-warning-800 mb-2 flex items-center gap-2">
                <AlertTriangle size={15} className="text-warning-600" />
                {t('regulatory.warningAttention')}
              </h3>
              <p className="text-sm text-warning-700">
                {t('regulatory.warningExpiringDays', { days: String(daysUntilExpiry) })}
              </p>
            </div>
          )}
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

export default PermitDetailPage;
