import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Trash2, PlusCircle, Calendar, FolderKanban, FileText, User } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  closingDocStatusColorMap,
  closingDocStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { closingApi, type Ks2DetailWithLines } from '@/api/closing';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ClosingDocStatus } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Ks2Line {
  id: string;
  sequence: number;
  name: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  vatRate: number;
  vatAmount: number;
  totalWithVat: number;
  notes?: string;
}

type Ks2WithLines = Ks2DetailWithLines;

// ---------------------------------------------------------------------------
// Line form local state
// ---------------------------------------------------------------------------

interface LineForm {
  name: string;
  unitOfMeasure: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  notes: string;
}

const DEFAULT_LINE: LineForm = {
  name: '',
  unitOfMeasure: 'шт',
  quantity: '1',
  unitPrice: '0',
  vatRate: '22',
  notes: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcPreview(form: LineForm): { amt: number; vatAmt: number; total: number } {
  const qty = parseFloat(form.quantity) || 0;
  const price = parseFloat(form.unitPrice) || 0;
  const vat = parseFloat(form.vatRate) || 0;
  const amt = qty * price;
  const vatAmt = amt * (vat / 100);
  return { amt, vatAmt, total: amt + vatAmt };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

const TableSkeleton: React.FC = () => (
  <>
    {[1, 2, 3].map((i) => (
      <tr key={i} className="animate-pulse">
        {Array.from({ length: 9 }).map((_, j) => (
          <td key={j} className="px-3 py-3">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ---------------------------------------------------------------------------
// Info card
// ---------------------------------------------------------------------------

const InfoCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div className="min-w-0">
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{value ?? '—'}</p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Ks2DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [lineForm, setLineForm] = useState<LineForm>(DEFAULT_LINE);

  // Query
  const { data: ks2, isLoading } = useQuery<Ks2WithLines>({
    queryKey: ['ks2', id],
    queryFn: () => closingApi.getKs2WithLines(id!),
    enabled: !!id,
  });

  // Status transition mutations
  const submitMutation = useMutation({
    mutationFn: () => closingApi.submitKs2(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2', id] });
      toast.success(t('closing.ks2Detail.toastSubmitted'));
    },
    onError: () => toast.error(t('closing.ks2Detail.toastSubmitError')),
  });

  const signMutation = useMutation({
    mutationFn: () => closingApi.signKs2(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2', id] });
      toast.success(t('closing.ks2Detail.toastSigned'));
    },
    onError: () => toast.error(t('closing.ks2Detail.toastSignError')),
  });

  const closeMutation = useMutation({
    mutationFn: () => closingApi.closeKs2(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2', id] });
      toast.success(t('closing.ks2Detail.toastClosed'));
      navigate('/ks2');
    },
    onError: () => toast.error(t('closing.ks2Detail.toastCloseError')),
  });

  // Line mutations
  const addLineMutation = useMutation({
    mutationFn: (data: {
      name: string;
      unitOfMeasure: string;
      quantity: number;
      unitPrice: number;
      vatRate?: number;
      notes?: string;
    }) => closingApi.addKs2Line(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2', id] });
      setLineForm(DEFAULT_LINE);
      toast.success(t('closing.ks2Detail.toastLineAdded'));
    },
    onError: () => toast.error(t('closing.ks2Detail.toastLineAddError')),
  });

  const removeLineMutation = useMutation({
    mutationFn: (lineId: string) => closingApi.removeKs2Line(lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2', id] });
      toast.success(t('closing.ks2Detail.toastLineRemoved'));
    },
    onError: () => toast.error(t('closing.ks2Detail.toastLineRemoveError')),
  });

  // Derived
  const status = ks2?.status;
  const isDraft = status === 'DRAFT';
  const preview = calcPreview(lineForm);

  // Handlers
  const handleAddLine = () => {
    const name = lineForm.name.trim();
    const qty = parseFloat(lineForm.quantity);
    const price = parseFloat(lineForm.unitPrice);
    const vat = parseFloat(lineForm.vatRate);

    if (!name) {
      toast.error(t('closing.ks2Detail.validationNameRequired'));
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      toast.error(t('closing.ks2Detail.validationQtyPositive'));
      return;
    }
    if (isNaN(price) || price < 0) {
      toast.error(t('closing.ks2Detail.validationPricePositive'));
      return;
    }
    if (isNaN(vat) || vat < 0 || vat > 100) {
      toast.error(t('closing.ks2Detail.validationVatRange'));
      return;
    }
    addLineMutation.mutate({
      name,
      unitOfMeasure: lineForm.unitOfMeasure,
      quantity: qty,
      unitPrice: price,
      vatRate: vat,
      notes: lineForm.notes.trim() || undefined,
    });
  };

  const handleLineChange = (field: keyof LineForm, value: string) => {
    setLineForm((prev) => ({ ...prev, [field]: value }));
  };

  // Render
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={ks2 ? `${t('closing.ks2Detail.titlePrefix')} №${ks2.number}` : t('closing.ks2Detail.titlePrefix')}
        subtitle={ks2?.name}
        backTo="/ks2"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('closing.ks2.breadcrumbKs2'), href: '/ks2' },
          { label: ks2?.number ?? '...' },
        ]}
        actions={
          ks2 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge
                status={ks2.status}
                colorMap={closingDocStatusColorMap}
                label={closingDocStatusLabels[ks2.status] ?? ks2.status}
                size="md"
              />
              {ks2.oneCPostingStatus && ks2.oneCPostingStatus !== 'NOT_SENT' && (
                <StatusBadge
                  status={ks2.oneCPostingStatus}
                  colorMap={{ SENT: 'blue', POSTED: 'green', ERROR: 'red' }}
                  label={ks2.oneCPostingStatusDisplayName ?? ks2.oneCPostingStatus}
                  size="md"
                />
              )}
              {status === 'DRAFT' && (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={submitMutation.isPending}
                  onClick={() => submitMutation.mutate()}
                >
                  {t('closing.ks2Detail.actionSubmit')}
                </Button>
              )}
              {status === 'SUBMITTED' && (
                <Button
                  size="sm"
                  loading={signMutation.isPending}
                  onClick={() => signMutation.mutate()}
                >
                  {t('closing.ks2Detail.actionSign')}
                </Button>
              )}
              {status === 'SIGNED' && (
                <Button
                  size="sm"
                  variant="success"
                  loading={closeMutation.isPending}
                  onClick={() => closeMutation.mutate()}
                >
                  {t('common.close')}
                </Button>
              )}
            </div>
          ) : null
        }
      />

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <InfoCard
          icon={<Calendar size={16} />}
          label={t('closing.ks2Detail.labelDocDate')}
          value={ks2 ? formatDate(ks2.documentDate) : undefined}
        />
        <InfoCard
          icon={<FolderKanban size={16} />}
          label={t('closing.ks2Detail.labelProject')}
          value={ks2?.projectName}
        />
        <InfoCard
          icon={<FileText size={16} />}
          label={t('closing.ks2Detail.labelContract')}
          value={ks2?.contractName}
        />
        <InfoCard
          icon={<User size={16} />}
          label={t('closing.ks2Detail.labelCreatedBy')}
          value={ks2?.createdByName}
        />
      </div>

      {/* Lines table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('closing.ks2Detail.sectionWorkItems')}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800 text-left">
                <th className="px-3 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-10 text-center">#</th>
                <th className="px-3 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 min-w-[200px]">{t('closing.ks2Detail.colName')}</th>
                <th className="px-3 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-16">{t('closing.ks2Detail.colUnit')}</th>
                <th className="px-3 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-20 text-right">{t('closing.ks2Detail.colQuantity')}</th>
                <th className="px-3 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-28 text-right">{t('closing.ks2Detail.colUnitPrice')}</th>
                <th className="px-3 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-28 text-right">{t('closing.ks2Detail.colAmountExVat')}</th>
                <th className="px-3 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-16 text-right">{t('closing.ks2Detail.colVatPercent')}</th>
                <th className="px-3 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-28 text-right">{t('closing.ks2Detail.colVatAmount')}</th>
                <th className="px-3 py-2.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-32 text-right">{t('closing.ks2Detail.colTotalWithVat')}</th>
                {isDraft && <th className="px-3 py-2.5 w-10" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <TableSkeleton />
              ) : ks2 && ks2.lines.length > 0 ? (
                ks2.lines.map((line) => (
                  <tr
                    key={line.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <td className="px-3 py-3 text-center text-xs text-neutral-400 tabular-nums">
                      {line.sequence}
                    </td>
                    <td className="px-3 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
                      {line.name}
                    </td>
                    <td className="px-3 py-3 text-neutral-500 dark:text-neutral-400 text-xs">
                      {line.unitOfMeasure}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                      {line.quantity.toLocaleString('ru-RU')}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                      {formatMoney(line.unitPrice)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                      {formatMoney(line.amount)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                      {line.vatRate}%
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                      {formatMoney(line.vatAmount)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-neutral-900 dark:text-neutral-100">
                      {formatMoney(line.totalWithVat)}
                    </td>
                    {isDraft && (
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          aria-label={t('closing.ks2Detail.ariaDeleteLine')}
                          disabled={removeLineMutation.isPending}
                          onClick={() => removeLineMutation.mutate(line.id)}
                          className="p-1 text-neutral-300 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={isDraft ? 10 : 9}
                    className="px-6 py-10 text-center text-sm text-neutral-400 dark:text-neutral-500"
                  >
                    {t('closing.ks2Detail.emptyLines')}
                  </td>
                </tr>
              )}
            </tbody>

            {/* Totals footer */}
            {ks2 && ks2.lines.length > 0 && (
              <tfoot>
                <tr className="bg-neutral-50 dark:bg-neutral-800 border-t-2 border-neutral-200 dark:border-neutral-700">
                  <td
                    colSpan={isDraft ? 5 : 5}
                    className="px-3 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wide"
                  >
                    {t('closing.ks2Detail.totalLabel')}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatMoney(ks2.totalAmount)}
                  </td>
                  <td />
                  <td className="px-3 py-3 text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatMoney(ks2.totalVatAmount)}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-bold text-primary-700 dark:text-primary-400 text-base">
                    {formatMoney(ks2.totalWithVat)}
                  </td>
                  {isDraft && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Add line form — only in DRAFT */}
        {isDraft && (
          <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 pt-4 pb-5 bg-neutral-50/50 dark:bg-neutral-800/30">
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-3 flex items-center gap-1.5">
              <PlusCircle size={13} />
              {t('closing.ks2Detail.addLine')}
            </p>

            {/* Input row */}
            <div className="grid grid-cols-12 gap-2 items-end">
              {/* Name */}
              <div className="col-span-12 sm:col-span-4">
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('closing.ks2Detail.colName')}
                </label>
                <Input
                  placeholder={t('closing.ks2Detail.placeholderWorkName')}
                  value={lineForm.name}
                  onChange={(e) => handleLineChange('name', e.target.value)}
                />
              </div>
              {/* Unit */}
              <div className="col-span-4 sm:col-span-1">
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('closing.ks2Detail.colUnit')}
                </label>
                <Input
                  placeholder={t('closing.ks2Detail.placeholderUnit')}
                  value={lineForm.unitOfMeasure}
                  onChange={(e) => handleLineChange('unitOfMeasure', e.target.value)}
                />
              </div>
              {/* Qty */}
              <div className="col-span-4 sm:col-span-1">
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('closing.ks2Detail.colQuantity')}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="1"
                  value={lineForm.quantity}
                  onChange={(e) => handleLineChange('quantity', e.target.value)}
                />
              </div>
              {/* Unit price */}
              <div className="col-span-4 sm:col-span-2">
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('closing.ks2Detail.colUnitPrice')}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={lineForm.unitPrice}
                  onChange={(e) => handleLineChange('unitPrice', e.target.value)}
                />
              </div>
              {/* VAT rate */}
              <div className="col-span-4 sm:col-span-1">
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('closing.ks2Detail.colVatPercent')}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="22"
                  value={lineForm.vatRate}
                  onChange={(e) => handleLineChange('vatRate', e.target.value)}
                />
              </div>
              {/* Notes */}
              <div className="col-span-8 sm:col-span-2">
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {t('closing.ks2Detail.labelNotes')}
                </label>
                <Input
                  placeholder={t('common.optional')}
                  value={lineForm.notes}
                  onChange={(e) => handleLineChange('notes', e.target.value)}
                />
              </div>
              {/* Button */}
              <div className="col-span-12 sm:col-span-1">
                <Button
                  size="sm"
                  fullWidth
                  loading={addLineMutation.isPending}
                  onClick={handleAddLine}
                >
                  {t('closing.ks2Detail.addButton')}
                </Button>
              </div>
            </div>

            {/* Live preview row */}
            {(parseFloat(lineForm.quantity) > 0 || parseFloat(lineForm.unitPrice) > 0) && (
              <div
                className={cn(
                  'mt-3 grid grid-cols-3 gap-3 p-3 rounded-lg text-xs',
                  'bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800',
                )}
              >
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">{t('closing.ks2Detail.previewAmountExVat')}: </span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                    {formatMoney(preview.amt)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">{t('closing.ks2Detail.previewVat', { rate: lineForm.vatRate })}: </span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                    {formatMoney(preview.vatAmt)}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400">{t('closing.ks2Detail.previewTotalWithVat')}: </span>
                  <span className="font-bold text-primary-700 dark:text-primary-400 tabular-nums">
                    {formatMoney(preview.total)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Ks2DetailPage;
