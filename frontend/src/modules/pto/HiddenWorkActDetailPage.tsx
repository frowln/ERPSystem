import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Trash2, Send, CheckCircle, XCircle, Paperclip, Shield } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Modal } from '@/design-system/components/Modal';
import { hiddenWorkActApi, type HiddenWorkActStatus, type HiddenWorkActSignature, type HiddenWorkActAttachment } from '@/api/hiddenWorkActs';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

const tp = (k: string, params?: Record<string, string>) => t(`aosr.${k}`, params);

const statusColorMap: Record<HiddenWorkActStatus, string> = {
  DRAFT: 'gray',
  PENDING_INSPECTION: 'yellow',
  INSPECTED: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

const sigStatusColorMap: Record<string, string> = {
  PENDING: 'yellow',
  SIGNED: 'green',
  REJECTED: 'red',
};

export default function HiddenWorkActDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState(false);

  const { data: act, isLoading } = useQuery({
    queryKey: ['hidden-work-act', id],
    queryFn: () => hiddenWorkActApi.getById(id!),
    enabled: !!id,
  });

  const { data: signatures } = useQuery({
    queryKey: ['hidden-work-act-signatures', id],
    queryFn: () => hiddenWorkActApi.getSignatures(id!),
    enabled: !!id,
  });

  const { data: attachments } = useQuery({
    queryKey: ['hidden-work-act-attachments', id],
    queryFn: () => hiddenWorkActApi.getAttachments(id!),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () => hiddenWorkActApi.submitForInspection(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hidden-work-act', id] });
      toast.success(tp('submitSuccess'));
    },
    onError: () => toast.error(tp('submitError')),
  });

  const statusMutation = useMutation({
    mutationFn: (status: HiddenWorkActStatus) => hiddenWorkActApi.updateStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hidden-work-act', id] });
      toast.success(tp('statusUpdated'));
    },
    onError: () => toast.error(tp('statusError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => hiddenWorkActApi.delete(id!),
    onSuccess: () => {
      toast.success(tp('deleteSuccess'));
      navigate('/pto/hidden-work-acts');
    },
    onError: () => toast.error(tp('deleteError')),
  });

  if (isLoading || !act) {
    return <div className="p-6">{t('common.loading')}</div>;
  }

  const sigs = signatures ?? [];
  const atts = attachments ?? [];
  const signedCount = sigs.filter((s) => s.status === 'SIGNED').length;
  const totalSigs = sigs.length;

  let materialsUsed: Array<{ name: string; quantity: string; certificate: string }> = [];
  try {
    if (act.materialsUsed) materialsUsed = JSON.parse(act.materialsUsed);
  } catch { /* ignore */ }

  let geodeticData: Array<{ point: string; x: string; y: string; z: string }> = [];
  try {
    if (act.geodeticData) geodeticData = JSON.parse(act.geodeticData);
  } catch { /* ignore */ }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${tp('titleDetail')}: ${act.actNumber || act.id.substring(0, 8)}`}
        subtitle={act.workDescription.substring(0, 100)}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('nav.pto-docs'), href: '/pto/documents' },
          { label: tp('breadcrumb'), href: '/pto/hidden-work-acts' },
          { label: act.actNumber || act.id.substring(0, 8) },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {act.status === 'DRAFT' && (
              <>
                <Button size="sm" variant="outline" onClick={() => navigate(`/pto/hidden-work-acts/${id}/edit`)}>
                  <Edit2 size={14} className="mr-1" /> {t('common.edit')}
                </Button>
                <Button size="sm" onClick={() => submitMutation.mutate()} loading={submitMutation.isPending}>
                  <Send size={14} className="mr-1" /> {tp('submitForInspection')}
                </Button>
              </>
            )}
            {act.status === 'INSPECTED' && (
              <>
                {/* P1-SAF-4: АОСР requires ≥3 signatures (СП 48.13330, Приказ 14) */}
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => statusMutation.mutate('APPROVED')}
                  disabled={signedCount < 3}
                  title={signedCount < 3 ? tp('approveRequires3Sigs', { count: String(signedCount) }) : undefined}
                >
                  <CheckCircle size={14} className="mr-1" /> {tp('approve')}
                </Button>
                <Button size="sm" variant="danger" onClick={() => statusMutation.mutate('REJECTED')}>
                  <XCircle size={14} className="mr-1" /> {tp('reject')}
                </Button>
              </>
            )}
            <Button size="sm" variant="danger" onClick={() => setShowDelete(true)}>
              <Trash2 size={14} className="mr-1" /> {t('common.delete')}
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label={tp('metricStatus')}
          value={act.statusDisplayName}
          loading={false}
        />
        <MetricCard
          label={tp('metricSignatures')}
          value={`${signedCount}/${totalSigs}`}
          loading={false}
        />
        <MetricCard
          label={tp('metricAttachments')}
          value={String(atts.length)}
          loading={false}
        />
        <MetricCard
          label={tp('metricInspectionDate')}
          value={act.inspectionDate ? formatDate(act.inspectionDate) : '—'}
          loading={false}
        />
      </div>

      {/* Main details */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">{tp('sectionGeneral')}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoRow label={tp('fieldNumber')} value={act.actNumber || '—'} />
          <InfoRow label={tp('fieldDate')} value={formatDate(act.date)} />
          <InfoRow label={tp('fieldLocation')} value={act.location || '—'} />
          <InfoRow label={tp('fieldInspectionDate')} value={act.inspectionDate ? formatDate(act.inspectionDate) : '—'} />
          <div className="md:col-span-2">
            <InfoRow label={tp('fieldWorkDescription')} value={act.workDescription} />
          </div>
          <InfoRow label={tp('fieldDrawingRef')} value={act.drawingReference || '—'} />
          <InfoRow label={tp('fieldSniPRef')} value={act.sniPReference || '—'} />
          <div className="md:col-span-2">
            <InfoRow label={tp('fieldConstructionMethod')} value={act.constructionMethod || '—'} />
          </div>
          <div className="md:col-span-2">
            <InfoRow label={tp('fieldNextWorkPermitted')} value={act.nextWorkPermitted || '—'} />
          </div>
          {act.notes && (
            <div className="md:col-span-2">
              <InfoRow label={tp('fieldNotes')} value={act.notes} />
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">{tp('fieldStatus')}:</span>
          <StatusBadge status={act.status} colorMap={statusColorMap} />
        </div>
        {act.rejectionReason && (
          <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-400">
              <strong>{tp('rejectionReason')}:</strong> {act.rejectionReason}
            </p>
          </div>
        )}
      </div>

      {/* Materials used */}
      {materialsUsed.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold">{tp('sectionMaterials')}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">{tp('materialName')}</th>
                <th className="text-left py-2 px-3">{tp('materialQuantity')}</th>
                <th className="text-left py-2 px-3">{tp('materialCertificate')}</th>
              </tr>
            </thead>
            <tbody>
              {materialsUsed.map((m, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 px-3">{m.name}</td>
                  <td className="py-2 px-3">{m.quantity}</td>
                  <td className="py-2 px-3 font-mono text-xs">{m.certificate || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Geodetic data */}
      {geodeticData.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold">{tp('sectionGeodetic')}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">{tp('geodeticPoint')}</th>
                <th className="text-left py-2 px-3">X</th>
                <th className="text-left py-2 px-3">Y</th>
                <th className="text-left py-2 px-3">Z</th>
              </tr>
            </thead>
            <tbody>
              {geodeticData.map((g, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 px-3 font-medium">{g.point}</td>
                  <td className="py-2 px-3 font-mono">{g.x}</td>
                  <td className="py-2 px-3 font-mono">{g.y}</td>
                  <td className="py-2 px-3 font-mono">{g.z}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Signatures */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield size={18} /> {tp('sectionSignatures')}
          </h3>
        </div>
        {sigs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{tp('noSignatures')}</p>
        ) : (
          <div className="space-y-3">
            {sigs.map((sig) => (
              <div key={sig.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{sig.signerName}</p>
                  <p className="text-xs text-gray-500">{tp(`role_${sig.signerRole}`)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {sig.signedAt && <span className="text-xs text-gray-400">{formatDate(sig.signedAt)}</span>}
                  <StatusBadge status={sig.status} colorMap={sigStatusColorMap} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attachments */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <Paperclip size={18} /> {tp('sectionAttachments')}
        </h3>
        {atts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{tp('noAttachments')}</p>
        ) : (
          <div className="space-y-2">
            {atts.map((att) => (
              <div key={att.id} className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-gray-800 p-3">
                <div>
                  <p className="text-sm font-medium">{att.fileName}</p>
                  <p className="text-xs text-gray-500">
                    {tp(`attachType_${att.attachmentType}`)}
                    {att.fileSize ? ` — ${(att.fileSize / 1024).toFixed(0)} KB` : ''}
                  </p>
                </div>
                {att.description && (
                  <span className="text-xs text-gray-400">{att.description}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete modal */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title={tp('deleteTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{tp('deleteDescription')}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDelete(false)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
