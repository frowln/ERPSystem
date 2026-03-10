import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Send, Clock, Building2, FileText, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { cdeApi } from '@/api/cde';
import { formatDate, formatDateLong } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { Transmittal, TransmittalItem } from './types';

const transmittalStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow'> = {
  DRAFT: 'gray',
  ISSUED: 'blue',
  ACKNOWLEDGED: 'yellow',
  RESPONDED: 'green',
  CLOSED: 'gray',
};

const getTransmittalStatusLabels = (): Record<string, string> => ({
  DRAFT: t('cde.statusDraft'),
  ISSUED: t('cde.statusIssued'),
  ACKNOWLEDGED: t('cde.statusAcknowledged'),
  RESPONDED: t('cde.statusResponded'),
  CLOSED: t('cde.statusClosed'),
});

const getPurposeLabels = (): Record<string, string> => ({
  FOR_INFORMATION: t('cde.purposeForInformation'),
  FOR_REVIEW: t('cde.purposeForReview'),
  FOR_APPROVAL: t('cde.purposeForApproval'),
  FOR_CONSTRUCTION: t('cde.purposeForConstruction'),
  AS_BUILT: t('cde.purposeAsBuilt'),
});

const getResponseStatusLabels = (): Record<string, string> => ({
  APPROVED: t('cde.responseApproved'),
  APPROVED_WITH_COMMENTS: t('cde.responseApprovedWithComments'),
  REJECTED: t('cde.responseRejected'),
  PENDING: t('cde.responsePending'),
});

const responseStatusColors: Record<string, 'green' | 'yellow' | 'red' | 'gray'> = {
  APPROVED: 'green',
  APPROVED_WITH_COMMENTS: 'yellow',
  REJECTED: 'red',
  PENDING: 'gray',
};

type DetailTab = 'overview' | 'items' | 'responses';

const TransmittalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const { data: transmittal } = useQuery<Transmittal>({
    queryKey: ['transmittal', id],
    queryFn: () => cdeApi.getTransmittal(id!),
    enabled: !!id,
  });

  const defaultTransmittal: Transmittal = {
    id: id ?? '',
    number: '',
    subject: '',
    purpose: 'FOR_INFORMATION',
    status: 'DRAFT',
    fromOrgName: '',
    toOrgName: '',
    issuedDate: '',
    itemCount: 0,
    createdAt: '',
  };

  const tr = transmittal ?? defaultTransmittal;
  const transmittalStatusLabels = getTransmittalStatusLabels();
  const purposeLabels = getPurposeLabels();
  const responseStatusLabels = getResponseStatusLabels();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tr.subject}
        subtitle={tr.number}
        backTo="/cde/transmittals"
        breadcrumbs={[
          { label: t('cde.breadcrumbHome'), href: '/' },
          { label: t('cde.breadcrumbCDE'), href: '/cde/documents' },
          { label: t('cde.transmittalDetail.breadcrumbTransmittals'), href: '/cde/transmittals' },
          { label: tr.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={tr.status}
              colorMap={transmittalStatusColorMap}
              label={transmittalStatusLabels[tr.status]}
              size="md"
            />
            {tr.status === 'ISSUED' && (
              <Button size="sm" iconLeft={<MessageSquare size={14} />} onClick={() => toast(t('common.operationStarted'))}>
                {t('cde.transmittalDetail.buttonReply')}
              </Button>
            )}
          </div>
        }
        tabs={[
          { id: 'overview', label: t('cde.transmittalDetail.tabOverview') },
          { id: 'items', label: t('cde.transmittalDetail.tabDocuments'), count: tr.itemCount },
          { id: 'responses', label: t('cde.transmittalDetail.tabResponses') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as DetailTab)}
      />

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={<FileText size={18} />} label={t('cde.transmittalDetail.metricDocuments')} value={tr.itemCount} />
            <MetricCard icon={<Send size={18} />} label={t('cde.transmittalDetail.metricPurpose')} value={purposeLabels[tr.purpose]} />
            <MetricCard icon={<Clock size={18} />} label={t('cde.transmittalDetail.metricDueDate')} value={tr.dueDate ? formatDate(tr.dueDate) : '---'} />
            <MetricCard icon={<Clock size={18} />} label={t('cde.transmittalDetail.metricResponseDate')} value={tr.respondedDate ? formatDate(tr.respondedDate) : t('cde.transmittalDetail.responseAwaiting')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('cde.transmittalDetail.sectionInfo')}</h3>
              <div className="space-y-4">
                <InfoItem icon={<Building2 size={15} />} label={t('cde.transmittalDetail.labelSender')} value={tr.fromOrgName} />
                <InfoItem icon={<Building2 size={15} />} label={t('cde.transmittalDetail.labelRecipient')} value={tr.toOrgName} />
                <InfoItem icon={<Send size={15} />} label={t('cde.transmittalDetail.labelPurpose')} value={purposeLabels[tr.purpose]} />
                <InfoItem icon={<Clock size={15} />} label={t('cde.transmittalDetail.labelIssuedDate')} value={formatDateLong(tr.issuedDate)} />
                {tr.dueDate && <InfoItem icon={<Clock size={15} />} label={t('cde.transmittalDetail.labelDueDate')} value={formatDateLong(tr.dueDate)} />}
                {tr.respondedDate && <InfoItem icon={<Clock size={15} />} label={t('cde.transmittalDetail.labelResponseDate')} value={formatDateLong(tr.respondedDate)} />}
              </div>
            </div>

            {tr.notes && (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('cde.transmittalDetail.sectionNotes')}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{tr.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('cde.transmittalDetail.sectionDocumentList')}</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('cde.transmittalDetail.colNumber')}</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('cde.transmittalDetail.colTitle')}</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('cde.transmittalDetail.colRevision')}</th>
                <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('cde.transmittalDetail.colResponseStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {([] as any[]).map((item, idx) => (
                <tr key={item.id} className={cn('border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800', idx % 2 === 1 && 'bg-neutral-25')}>
                  <td className="px-5 py-3 text-sm font-mono text-neutral-500 dark:text-neutral-400">{item.documentNumber}</td>
                  <td className="px-5 py-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.documentTitle}</td>
                  <td className="px-5 py-3 text-sm font-mono text-primary-600">{item.revision}</td>
                  <td className="px-5 py-3">
                    {item.responseStatus ? (
                      <StatusBadge
                        status={item.responseStatus}
                        colorMap={responseStatusColors}
                        label={responseStatusLabels[item.responseStatus] ?? item.responseStatus}
                      />
                    ) : (
                      <span className="text-sm text-neutral-400">---</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'responses' && (
        <div className="space-y-4">
          {([] as any[])
            .filter((item) => item.responseComment)
            .map((item) => (
              <div key={item.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{item.documentNumber}</span>
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.documentTitle}</span>
                  </div>
                  {item.responseStatus && (
                    <StatusBadge
                      status={item.responseStatus}
                      colorMap={responseStatusColors}
                      label={responseStatusLabels[item.responseStatus] ?? item.responseStatus}
                    />
                  )}
                </div>
                <p className="text-sm text-neutral-600 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">{item.responseComment}</p>
              </div>
            ))}
        </div>
      )}
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

export default TransmittalDetailPage;
