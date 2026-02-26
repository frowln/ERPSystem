import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Trash2,
  PlusCircle,
  Calendar,
  FolderKanban,
  FileText,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Receipt,
  Download,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  closingDocStatusColorMap,
  closingDocStatusLabels,
} from '@/design-system/components/StatusBadge';
import { Input, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { closingApi, type Ks2DetailWithLines } from '@/api/closing';
import { estimatesApi } from '@/api/estimates';
import { formatMoney, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { ClosingDocStatus } from '@/types';
import type { Ks2VolumeCheck, Ks2PaymentInfo, EstimateItemForImport } from '@/modules/closing/types';

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
// Import modal selection state
// ---------------------------------------------------------------------------

interface ImportSelection {
  [estimateItemId: string]: number; // quantity to import
}

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

function volumeStatusIcon(status: Ks2VolumeCheck['status']): React.ReactNode {
  switch (status) {
    case 'within_limit':
      return <CheckCircle2 size={14} className="text-success-600 dark:text-success-400" />;
    case 'warning':
      return <AlertTriangle size={14} className="text-warning-600 dark:text-warning-400" />;
    case 'exceeds':
      return <XCircle size={14} className="text-danger-600 dark:text-danger-400" />;
  }
}

function volumeStatusBg(status: Ks2VolumeCheck['status']): string {
  switch (status) {
    case 'within_limit':
      return 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800';
    case 'warning':
      return 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800';
    case 'exceeds':
      return 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800';
  }
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
// Payment Status Card
// ---------------------------------------------------------------------------

const PaymentStatusCard: React.FC<{
  paymentInfo: Ks2PaymentInfo;
}> = ({ paymentInfo }) => {
  const hasInvoice = !!paymentInfo.invoiceId;
  const percent = Math.min(paymentInfo.paymentPercent, 100);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={16} className="text-neutral-400" />
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('closing.ks2Detail.paymentStatusTitle')}
        </h3>
      </div>

      {hasInvoice ? (
        <div className="space-y-4">
          {/* Invoice info row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('closing.ks2Detail.paymentInvoiceNumber')}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Link
                  to={`/invoices/${paymentInfo.invoiceId}`}
                  className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                >
                  {paymentInfo.invoiceNumber}
                  <ExternalLink size={12} />
                </Link>
                {paymentInfo.invoiceStatus && (
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      paymentInfo.invoiceStatus === 'PAID'
                        ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                        : paymentInfo.invoiceStatus === 'OVERDUE'
                          ? 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
                    )}
                  >
                    {paymentInfo.invoiceStatus}
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('closing.ks2Detail.paymentInvoiceAmount')}
              </span>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mt-0.5 tabular-nums">
                {formatMoney(paymentInfo.invoiceAmount ?? 0)}
              </p>
            </div>

            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('closing.ks2Detail.paymentPaidAmount')}
              </span>
              <p className="text-sm font-medium text-success-700 dark:text-success-400 mt-0.5 tabular-nums">
                {formatMoney(paymentInfo.paidAmount)}
              </p>
            </div>

            <div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('closing.ks2Detail.paymentRemaining')}
              </span>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mt-0.5 tabular-nums">
                {formatMoney(paymentInfo.remainingAmount)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('closing.ks2Detail.paymentProgress')}
              </span>
              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 tabular-nums">
                {percent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  percent >= 100
                    ? 'bg-success-500'
                    : percent >= 50
                      ? 'bg-primary-500'
                      : 'bg-warning-500',
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('closing.ks2Detail.paymentNoInvoice')}
        </p>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Volume Check Inline Badge
// ---------------------------------------------------------------------------

const VolumeCheckBadge: React.FC<{
  check: Ks2VolumeCheck;
}> = ({ check }) => (
  <div
    className={cn(
      'mt-1.5 flex items-center gap-2 px-2 py-1 rounded text-xs border',
      volumeStatusBg(check.status),
    )}
  >
    {volumeStatusIcon(check.status)}
    <span className="text-neutral-600 dark:text-neutral-300">
      {t('closing.ks2Detail.volumeEstimate')}: {check.estimateQty.toLocaleString('ru-RU')} {check.unit}
    </span>
    <span className="text-neutral-400 dark:text-neutral-500">|</span>
    <span className="text-neutral-600 dark:text-neutral-300">
      {t('closing.ks2Detail.volumeSubmitted')}: {check.totalSubmitted.toLocaleString('ru-RU')}
    </span>
    <span className="text-neutral-400 dark:text-neutral-500">|</span>
    <span
      className={cn(
        'font-medium',
        check.status === 'within_limit' && 'text-success-700 dark:text-success-400',
        check.status === 'warning' && 'text-warning-700 dark:text-warning-400',
        check.status === 'exceeds' && 'text-danger-700 dark:text-danger-400',
      )}
    >
      {t('closing.ks2Detail.volumeRemaining')}: {check.remaining.toLocaleString('ru-RU')}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// Import from Estimate Modal
// ---------------------------------------------------------------------------

const ImportFromEstimateModal: React.FC<{
  open: boolean;
  onClose: () => void;
  ks2Id: string;
  projectId: string;
}> = ({ open, onClose, ks2Id, projectId }) => {
  const queryClient = useQueryClient();
  const [selectedEstimateId, setSelectedEstimateId] = useState('');
  const [selections, setSelections] = useState<ImportSelection>({});
  const [importingItems, setImportingItems] = useState<Set<string>>(new Set());

  // Fetch estimates for the project
  const { data: estimatesData } = useQuery({
    queryKey: ['estimates', 'forProject', projectId],
    queryFn: () => estimatesApi.getEstimates({ projectId }),
    enabled: open && !!projectId,
  });

  const estimates = estimatesData?.content ?? [];

  // Fetch available estimate items
  const { data: estimateItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['estimateItemsForKs2', selectedEstimateId, ks2Id],
    queryFn: () => closingApi.getEstimateItemsForKs2(selectedEstimateId, ks2Id),
    enabled: !!selectedEstimateId,
  });

  // Add line mutation (reused for each imported item)
  const addLineMutation = useMutation({
    mutationFn: (data: {
      name: string;
      unitOfMeasure: string;
      quantity: number;
      unitPrice: number;
    }) => closingApi.addKs2Line(ks2Id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2', ks2Id] });
      queryClient.invalidateQueries({ queryKey: ['estimateItemsForKs2', selectedEstimateId, ks2Id] });
    },
  });

  const handleQuantityChange = (itemId: string, value: string) => {
    const qty = parseFloat(value) || 0;
    setSelections((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: qty };
    });
  };

  const selectedCount = Object.keys(selections).filter((k) => selections[k] > 0).length;

  const handleImport = async () => {
    if (!estimateItems) return;

    const entriesToImport = Object.entries(selections).filter(([, qty]) => qty > 0);
    if (entriesToImport.length === 0) return;

    const itemsInFlight = new Set<string>();
    entriesToImport.forEach(([id]) => itemsInFlight.add(id));
    setImportingItems(itemsInFlight);

    let successCount = 0;
    let errorCount = 0;

    for (const [itemId, qty] of entriesToImport) {
      const item = estimateItems.find((ei) => ei.id === itemId);
      if (!item) continue;

      try {
        await addLineMutation.mutateAsync({
          name: item.name,
          unitOfMeasure: item.unitOfMeasure,
          quantity: qty,
          unitPrice: item.unitPrice,
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setImportingItems(new Set());
    setSelections({});

    if (successCount > 0) {
      toast.success(t('closing.ks2Detail.importSuccess', { count: String(successCount) }));
    }
    if (errorCount > 0) {
      toast.error(t('closing.ks2Detail.importPartialError', { count: String(errorCount) }));
    }

    if (errorCount === 0) {
      onClose();
    }
  };

  const handleClose = () => {
    setSelections({});
    setSelectedEstimateId('');
    onClose();
  };

  const isImporting = importingItems.size > 0;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('closing.ks2Detail.importModalTitle')}
      description={t('closing.ks2Detail.importModalDescription')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isImporting}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            loading={isImporting}
            disabled={selectedCount === 0}
          >
            {t('closing.ks2Detail.importButton', { count: String(selectedCount) })}
          </Button>
        </>
      }
    >
      {/* Estimate selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
          {t('closing.ks2Detail.importSelectEstimate')}
        </label>
        <Select
          value={selectedEstimateId}
          onChange={(e) => {
            setSelectedEstimateId(e.target.value);
            setSelections({});
          }}
          placeholder={t('closing.ks2Detail.importEstimatePlaceholder')}
          options={estimates.map((est) => ({ value: est.id, label: est.name }))}
        />
      </div>

      {/* Items table */}
      {selectedEstimateId && (
        <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-700 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800 text-left">
                <th className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 min-w-[200px]">
                  {t('closing.ks2Detail.colName')}
                </th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-16">
                  {t('closing.ks2Detail.colUnit')}
                </th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-24 text-right">
                  {t('closing.ks2Detail.importEstimateQty')}
                </th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-24 text-right">
                  {t('closing.ks2Detail.importAlreadySubmitted')}
                </th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-24 text-right">
                  {t('closing.ks2Detail.importRemaining')}
                </th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-28 text-right">
                  {t('closing.ks2Detail.colUnitPrice')}
                </th>
                <th className="px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 w-28">
                  {t('closing.ks2Detail.importQtyToAdd')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {itemsLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="animate-pulse flex justify-center">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-48" />
                    </div>
                  </td>
                </tr>
              ) : estimateItems && estimateItems.length > 0 ? (
                estimateItems.map((item) => {
                  const maxQty = item.remaining;
                  const currentQty = selections[item.id] ?? 0;
                  const isOverMax = currentQty > maxQty;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors',
                        importingItems.has(item.id) && 'opacity-50',
                      )}
                    >
                      <td className="px-3 py-2.5 text-neutral-800 dark:text-neutral-200 font-medium">
                        {item.name}
                      </td>
                      <td className="px-3 py-2.5 text-neutral-500 dark:text-neutral-400 text-xs">
                        {item.unitOfMeasure}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                        {item.quantity.toLocaleString('ru-RU')}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-neutral-500 dark:text-neutral-400">
                        {item.alreadySubmitted.toLocaleString('ru-RU')}
                      </td>
                      <td
                        className={cn(
                          'px-3 py-2.5 text-right tabular-nums font-medium',
                          maxQty > 0
                            ? 'text-success-700 dark:text-success-400'
                            : 'text-neutral-400 dark:text-neutral-500',
                        )}
                      >
                        {maxQty.toLocaleString('ru-RU')}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-neutral-700 dark:text-neutral-300">
                        {formatMoney(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={currentQty > 0 ? String(currentQty) : ''}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          disabled={maxQty <= 0 || isImporting}
                          hasError={isOverMax}
                          className="w-24"
                        />
                        {isOverMax && (
                          <p className="text-xs text-danger-600 mt-0.5">
                            {t('closing.ks2Detail.importExceedsRemaining')}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-neutral-400 dark:text-neutral-500">
                    {t('closing.ks2Detail.importNoItems')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Ks2DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [lineForm, setLineForm] = useState<LineForm>(DEFAULT_LINE);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // ----- Core query -----
  const { data: ks2, isLoading } = useQuery<Ks2WithLines>({
    queryKey: ['ks2', id],
    queryFn: () => closingApi.getKs2WithLines(id!),
    enabled: !!id,
  });

  // ----- Volume check query -----
  const { data: volumeChecks } = useQuery<Ks2VolumeCheck[]>({
    queryKey: ['ks2VolumeChecks', id],
    queryFn: () => closingApi.checkKs2Volumes(id!),
    enabled: !!id && !!ks2?.projectId,
  });

  // Build a lookup map: workItem name -> volume check
  const volumeCheckMap = useMemo(() => {
    if (!volumeChecks) return new Map<string, Ks2VolumeCheck>();
    const map = new Map<string, Ks2VolumeCheck>();
    for (const vc of volumeChecks) {
      map.set(vc.workItem, vc);
    }
    return map;
  }, [volumeChecks]);

  // ----- Payment status query -----
  const { data: paymentInfo } = useQuery<Ks2PaymentInfo>({
    queryKey: ['ks2PaymentStatus', id],
    queryFn: () => closingApi.getKs2PaymentStatus(id!),
    enabled: !!id,
  });

  // ----- Status transition mutations -----
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
      queryClient.invalidateQueries({ queryKey: ['ks2PaymentStatus', id] });
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

  // ----- Create Invoice mutation -----
  const createInvoiceMutation = useMutation({
    mutationFn: () => closingApi.createInvoiceFromKs2(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ks2PaymentStatus', id] });
      toast.success(t('closing.ks2Detail.toastInvoiceCreated'));
      navigate(`/invoices/${data.invoiceId}`);
    },
    onError: () => toast.error(t('closing.ks2Detail.toastInvoiceCreateError')),
  });

  // ----- Line mutations -----
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
      queryClient.invalidateQueries({ queryKey: ['ks2VolumeChecks', id] });
      setLineForm(DEFAULT_LINE);
      toast.success(t('closing.ks2Detail.toastLineAdded'));
    },
    onError: () => toast.error(t('closing.ks2Detail.toastLineAddError')),
  });

  const removeLineMutation = useMutation({
    mutationFn: (lineId: string) => closingApi.removeKs2Line(lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ks2', id] });
      queryClient.invalidateQueries({ queryKey: ['ks2VolumeChecks', id] });
      toast.success(t('closing.ks2Detail.toastLineRemoved'));
    },
    onError: () => toast.error(t('closing.ks2Detail.toastLineRemoveError')),
  });

  // ----- Derived -----
  const status = ks2?.status;
  const isDraft = status === 'DRAFT';
  const isSigned = status === 'SIGNED';
  const preview = calcPreview(lineForm);
  const hasNoInvoice = paymentInfo && !paymentInfo.invoiceId;

  // ----- Handlers -----
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

  // ----- Render -----
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
              {isDraft && (
                <Button
                  size="sm"
                  variant="secondary"
                  iconLeft={<Download size={14} />}
                  onClick={() => setImportModalOpen(true)}
                >
                  {t('closing.ks2Detail.actionImportFromEstimate')}
                </Button>
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
              {isSigned && hasNoInvoice && (
                <Button
                  size="sm"
                  variant="primary"
                  iconLeft={<Receipt size={14} />}
                  loading={createInvoiceMutation.isPending}
                  onClick={() => createInvoiceMutation.mutate()}
                >
                  {t('closing.ks2Detail.actionCreateInvoice')}
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

      {/* Payment Status Card */}
      {paymentInfo && (paymentInfo.invoiceId || paymentInfo.paidAmount > 0) && (
        <PaymentStatusCard paymentInfo={paymentInfo} />
      )}

      {/* Create Invoice prompt card — when SIGNED and no invoice */}
      {isSigned && hasNoInvoice && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Receipt size={20} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                {t('closing.ks2Detail.createInvoicePromptTitle')}
              </p>
              <p className="text-xs text-primary-700 dark:text-primary-300 mt-0.5">
                {t('closing.ks2Detail.createInvoicePromptDescription')}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            iconLeft={<Receipt size={14} />}
            loading={createInvoiceMutation.isPending}
            onClick={() => createInvoiceMutation.mutate()}
          >
            {t('closing.ks2Detail.actionCreateInvoice')}
          </Button>
        </div>
      )}

      {/* Lines table */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('closing.ks2Detail.sectionWorkItems')}
          </h2>
          {volumeChecks && volumeChecks.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 size={12} className="text-success-500" />
                {t('closing.ks2Detail.volumeLegendOk')}
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle size={12} className="text-warning-500" />
                {t('closing.ks2Detail.volumeLegendWarning')}
              </span>
              <span className="flex items-center gap-1">
                <XCircle size={12} className="text-danger-500" />
                {t('closing.ks2Detail.volumeLegendExceeds')}
              </span>
            </div>
          )}
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
                ks2.lines.map((line) => {
                  const volumeCheck = volumeCheckMap.get(line.name);

                  return (
                    <tr
                      key={line.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-3 py-3 text-center text-xs text-neutral-400 tabular-nums align-top">
                        {line.sequence}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                          {line.name}
                        </span>
                        {volumeCheck && <VolumeCheckBadge check={volumeCheck} />}
                      </td>
                      <td className="px-3 py-3 text-neutral-500 dark:text-neutral-400 text-xs align-top">
                        {line.unitOfMeasure}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300 align-top">
                        {line.quantity.toLocaleString('ru-RU')}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300 align-top">
                        {formatMoney(line.unitPrice)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300 align-top">
                        {formatMoney(line.amount)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-neutral-500 dark:text-neutral-400 align-top">
                        {line.vatRate}%
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-neutral-700 dark:text-neutral-300 align-top">
                        {formatMoney(line.vatAmount)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium text-neutral-900 dark:text-neutral-100 align-top">
                        {formatMoney(line.totalWithVat)}
                      </td>
                      {isDraft && (
                        <td className="px-3 py-3 text-center align-top">
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
                  );
                })
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

        {/* Add line form -- only in DRAFT */}
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

      {/* Import from Estimate Modal */}
      {ks2 && (
        <ImportFromEstimateModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          ks2Id={id!}
          projectId={ks2.projectId}
        />
      )}
    </div>
  );
};

export default Ks2DetailPage;
