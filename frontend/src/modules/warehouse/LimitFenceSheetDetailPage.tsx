import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Trash2, XCircle, ArrowDownToLine, CornerDownLeft } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { Input } from '@/design-system/components/FormField';
import {
  StatusBadge,
  limitFenceSheetStatusColorMap,
  limitFenceSheetStatusLabels,
} from '@/design-system/components/StatusBadge';
import { limitFenceSheetsApi } from '@/api/limitFenceSheets';
import { formatDate } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { AuditFooter } from '@/design-system/components/AuditFooter';

const LimitFenceSheetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [issueOpen, setIssueOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [quantity, setQuantity] = useState('');

  const { data: sheet, isLoading } = useQuery({
    queryKey: ['limit-fence-sheet', id],
    queryFn: () => limitFenceSheetsApi.getSheet(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['limit-fence-sheet', id] });
    queryClient.invalidateQueries({ queryKey: ['limit-fence-sheets'] });
  };

  const issueMutation = useMutation({
    mutationFn: (qty: number) => limitFenceSheetsApi.issueBySheet(id!, qty),
    onSuccess: () => {
      invalidate();
      setIssueOpen(false);
      setQuantity('');
      toast.success(t('warehouse.limitFenceSheet.toastIssued', { quantity, unit: sheet?.unit ?? '' }));
    },
    onError: () => toast.error(t('warehouse.limitFenceSheet.toastError')),
  });

  const returnMutation = useMutation({
    mutationFn: (qty: number) => limitFenceSheetsApi.returnBySheet(id!, qty),
    onSuccess: () => {
      invalidate();
      setReturnOpen(false);
      setQuantity('');
      toast.success(t('warehouse.limitFenceSheet.toastReturned', { quantity, unit: sheet?.unit ?? '' }));
    },
    onError: () => toast.error(t('warehouse.limitFenceSheet.toastError')),
  });

  const closeMutation = useMutation({
    mutationFn: () => limitFenceSheetsApi.closeSheet(id!),
    onSuccess: () => {
      invalidate();
      setCloseOpen(false);
      toast.success(t('warehouse.limitFenceSheet.toastClosed', { number: sheet?.sheetNumber ?? '' }));
    },
    onError: () => toast.error(t('warehouse.limitFenceSheet.toastError')),
  });

  const deleteMutation = useMutation({
    mutationFn: () => limitFenceSheetsApi.deleteSheet(id!),
    onSuccess: () => {
      toast.success(t('warehouse.limitFenceSheet.toastDeleted', { number: sheet?.sheetNumber ?? '' }));
      navigate('/warehouse/limit-fence-sheets');
    },
    onError: () => toast.error(t('warehouse.limitFenceSheet.toastError')),
  });

  if (isLoading || !sheet) {
    return (
      <div className="animate-pulse space-y-4 p-6">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
        <div className="h-40 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    );
  }

  const remaining = sheet.limitQuantity - sheet.issuedQuantity + sheet.returnedQuantity;
  const usedNet = sheet.issuedQuantity - sheet.returnedQuantity;
  const pct = sheet.limitQuantity > 0 ? (usedNet / sheet.limitQuantity) * 100 : 0;
  const isActive = sheet.status === 'ACTIVE' || sheet.status === 'EXHAUSTED';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.limitFenceSheet.detailTitle', { number: sheet.sheetNumber })}
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.limitFenceSheet.breadcrumb'), href: '/warehouse/limit-fence-sheets' },
          { label: sheet.sheetNumber },
        ]}
        backTo="/warehouse/limit-fence-sheets"
        actions={
          <div className="flex items-center gap-2">
            {sheet.status === 'ACTIVE' && (
              <>
                <Button variant="secondary" size="sm" iconLeft={<ArrowDownToLine size={14} />} onClick={() => setIssueOpen(true)}>
                  {t('warehouse.limitFenceSheet.actionIssue')}
                </Button>
                <Button variant="secondary" size="sm" iconLeft={<CornerDownLeft size={14} />} onClick={() => setReturnOpen(true)}>
                  {t('warehouse.limitFenceSheet.actionReturn')}
                </Button>
              </>
            )}
            {isActive && (
              <Button variant="secondary" size="sm" iconLeft={<XCircle size={14} />} onClick={() => setCloseOpen(true)}>
                {t('warehouse.limitFenceSheet.actionClose')}
              </Button>
            )}
            {sheet.status === 'ACTIVE' && (
              <Button variant="secondary" size="sm" iconLeft={<Edit2 size={14} />} onClick={() => navigate(`/warehouse/limit-fence-sheets/${id}/edit`)}>
                {t('warehouse.limitFenceSheet.actionEdit')}
              </Button>
            )}
            {sheet.issuedQuantity === 0 && (
              <Button variant="danger" size="sm" iconLeft={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)}>
                {t('warehouse.limitFenceSheet.actionDelete')}
              </Button>
            )}
          </div>
        }
      />

      <div className="max-w-4xl space-y-6">
        {/* Status */}
        <div className="flex items-center gap-3">
          <StatusBadge
            status={sheet.status}
            colorMap={limitFenceSheetStatusColorMap}
            label={limitFenceSheetStatusLabels[sheet.status] ?? sheet.status}
          />
        </div>

        {/* Limit Progress */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('warehouse.limitFenceSheet.detailLimitProgress')}</h2>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-danger-500' : pct >= 70 ? 'bg-warning-500' : 'bg-primary-500'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium tabular-nums text-neutral-900 dark:text-neutral-100">{Math.round(pct)}%</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.limitFenceSheet.columnLimit')}</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                {sheet.limitQuantity.toLocaleString('ru-RU')} {sheet.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.limitFenceSheet.detailIssued')}</p>
              <p className="text-lg font-semibold text-danger-600 tabular-nums">
                {sheet.issuedQuantity.toLocaleString('ru-RU')} {sheet.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.limitFenceSheet.detailReturned')}</p>
              <p className="text-lg font-semibold text-success-600 tabular-nums">
                {sheet.returnedQuantity.toLocaleString('ru-RU')} {sheet.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.limitFenceSheet.detailRemaining')}</p>
              <p className="text-lg font-semibold text-primary-600 tabular-nums">
                {remaining.toLocaleString('ru-RU')} {sheet.unit}
              </p>
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.limitFenceSheet.detailMaterial')}</p>
              <p className="text-sm text-neutral-900 dark:text-neutral-100">{sheet.materialName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.limitFenceSheet.detailPeriod')}</p>
              <p className="text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">
                {formatDate(sheet.periodStart)} — {formatDate(sheet.periodEnd)}
              </p>
            </div>
            {sheet.notes && (
              <div className="col-span-2">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('warehouse.limitFenceSheet.detailNotes')}</p>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">{sheet.notes}</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Issue Modal */}      <AuditFooter data={sheet} />

<Modal
        open={issueOpen}
        onClose={() => { setIssueOpen(false); setQuantity(''); }}
        title={t('warehouse.limitFenceSheet.issueTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setIssueOpen(false); setQuantity(''); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => issueMutation.mutate(Number(quantity))}
              loading={issueMutation.isPending}
              disabled={!quantity || Number(quantity) <= 0}
            >
              {t('warehouse.limitFenceSheet.issueConfirm')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          {t('warehouse.limitFenceSheet.detailRemaining')}: {remaining.toLocaleString('ru-RU')} {sheet.unit}
        </p>
        <Input
          type="number"
          placeholder="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min={0}
          max={remaining}
        />
      </Modal>

      {/* Return Modal */}
      <Modal
        open={returnOpen}
        onClose={() => { setReturnOpen(false); setQuantity(''); }}
        title={t('warehouse.limitFenceSheet.returnTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setReturnOpen(false); setQuantity(''); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => returnMutation.mutate(Number(quantity))}
              loading={returnMutation.isPending}
              disabled={!quantity || Number(quantity) <= 0}
            >
              {t('warehouse.limitFenceSheet.returnConfirm')}
            </Button>
          </>
        }
      >
        <Input
          type="number"
          placeholder="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min={0}
        />
      </Modal>

      {/* Close Confirmation */}
      <ConfirmDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        onConfirm={() => closeMutation.mutate()}
        loading={closeMutation.isPending}
        title={t('warehouse.limitFenceSheet.closeConfirmTitle')}
        description={t('warehouse.limitFenceSheet.closeConfirmMessage', { number: sheet.sheetNumber })}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
        title={t('warehouse.limitFenceSheet.deleteConfirmTitle')}
        description={t('warehouse.limitFenceSheet.deleteConfirmMessage', { number: sheet.sheetNumber })}
        confirmVariant="danger"
      />
    </div>
  );
};

export default LimitFenceSheetDetailPage;
