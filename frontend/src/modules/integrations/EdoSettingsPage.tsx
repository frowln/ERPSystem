import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import {
  FileText,
  Send,
  PenTool,
  Inbox,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Shield,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { DataTable } from '@/design-system/components/DataTable';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { MetricCard } from '@/design-system/components/MetricCard';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { Modal } from '@/design-system/components/Modal';
import { cn } from '@/lib/cn';
import { formatDateTime, formatMoney } from '@/lib/format';
import { integrationsApi, type EdoStatusData } from '@/api/integrations';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const defaultEdoStatus: EdoStatusData = {
  configured: false,
  connected: false,
  provider: '',
  totalDocuments: 0,
  pendingDocuments: 0,
  lastReceivedAt: '',
};

interface EdoDocumentRow {
  id: string;
  number: string;
  name: string;
  provider: string;
  providerLabel: string;
  direction: 'inbox' | 'outbox';
  status: string;
  senderName: string;
  recipientName: string;
  totalAmount: number;
  sentAt: string | null;
  receivedAt: string | null;
  signedAt: string | null;
}


const edoStatusColorMap: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'cyan' | 'orange'> = {
  created: 'gray',
  signing: 'yellow',
  signed: 'green',
  sent: 'blue',
  delivered: 'cyan',
  rejected: 'red',
  expired: 'orange',
};

const getEdoStatusLabels = (): Record<string, string> => ({
  created: t('integrations.edo.docStatusCreated'),
  signing: t('integrations.edo.docStatusSigning'),
  signed: t('integrations.edo.docStatusSigned'),
  sent: t('integrations.edo.docStatusSent'),
  delivered: t('integrations.edo.docStatusDelivered'),
  rejected: t('integrations.edo.docStatusRejected'),
  expired: t('integrations.edo.docStatusExpired'),
});

const providerColorMap: Record<string, 'blue' | 'green' | 'purple'> = {
  DIADOC: 'blue',
  SBIS: 'green',
  KONTUR: 'purple',
};

type TabId = 'inbox' | 'outbox' | 'all';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const EdoSettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    provider: 'DIADOC',
    docType: 'UPD',
    recipientInn: '',
    docNumber: '',
    docName: '',
    amount: '',
  });

  const sendDocumentMutation = useMutation({
    mutationFn: (data: typeof sendForm) => integrationsApi.edo.sendDocument({
      provider: data.provider,
      docType: data.docType,
      recipientInn: data.recipientInn,
      number: data.docNumber,
      name: data.docName,
      amount: data.amount ? parseFloat(data.amount) : undefined,
    }),
    onSuccess: () => {
      toast.success(t('integrations.edo.documentSent'));
      setShowSendModal(false);
      setSendForm({ provider: 'DIADOC', docType: 'UPD', recipientInn: '', docNumber: '', docName: '', amount: '' });
      queryClient.invalidateQueries({ queryKey: ['edo-documents'] });
      queryClient.invalidateQueries({ queryKey: ['edo-status'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const { data: edoStatus } = useQuery<EdoStatusData>({
    queryKey: ['edo-status'],
    queryFn: async () => {
      try {
        return await integrationsApi.edo.getStatus();
      } catch {
        return defaultEdoStatus;
      }
    },
  });

  const status = edoStatus ?? defaultEdoStatus;

  const { data: edoDocumentsData } = useQuery<EdoDocumentRow[]>({
    queryKey: ['edo-documents'],
    queryFn: async () => {
      try {
        const res = await integrationsApi.edo.getInbox();
        return (res as any).content ?? res ?? [];
      } catch {
        return [];
      }
    },
  });

  const documents = edoDocumentsData ?? [];

  const filtered = useMemo(() => {
    let result = documents;
    if (activeTab === 'inbox') result = result.filter((d) => d.direction === 'inbox');
    if (activeTab === 'outbox') result = result.filter((d) => d.direction === 'outbox');
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.number.toLowerCase().includes(lower) ||
          d.name.toLowerCase().includes(lower) ||
          d.senderName.toLowerCase().includes(lower) ||
          d.recipientName.toLowerCase().includes(lower),
      );
    }
    return result;
  }, [documents, activeTab, search]);

  const tabCounts = useMemo(() => ({
    all: documents.length,
    inbox: documents.filter((d) => d.direction === 'inbox').length,
    outbox: documents.filter((d) => d.direction === 'outbox').length,
  }), [documents]);

  const handleSign = useCallback(async (docId: string) => {
    try {
      await integrationsApi.edo.signDocument(docId);
      toast.success(t('integrations.edo.documentSigned'));
      queryClient.invalidateQueries({ queryKey: ['edo-documents'] });
    } catch {
      toast.error(t('integrations.edo.signError'));
    }
  }, [queryClient]);

  const edoStatusLabels = getEdoStatusLabels();

  const columns = useMemo<ColumnDef<EdoDocumentRow, unknown>[]>(() => [
    {
      accessorKey: 'number',
      header: t('integrations.edo.colNumber'),
      size: 160,
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{row.original.number}</p>
          <StatusBadge
            status={row.original.provider}
            colorMap={providerColorMap}
            label={row.original.providerLabel}
            size="sm"
          />
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: t('integrations.edo.colDocument'),
      size: 280,
      cell: ({ getValue }) => (
        <span className="text-neutral-800 dark:text-neutral-200 text-sm">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'direction',
      header: t('integrations.edo.colDirection'),
      size: 120,
      cell: ({ getValue }) => (
        <div className="flex items-center gap-1.5">
          {getValue<string>() === 'inbox' ? (
            <>
              <Inbox size={14} className="text-cyan-500" />
              <span className="text-xs text-neutral-600">{t('integrations.edo.directionInbox')}</span>
            </>
          ) : (
            <>
              <ArrowUpRight size={14} className="text-blue-500" />
              <span className="text-xs text-neutral-600">{t('integrations.edo.directionOutbox')}</span>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'senderName',
      header: t('integrations.edo.colSender'),
      size: 180,
    },
    {
      accessorKey: 'status',
      header: t('integrations.edo.colStatus'),
      size: 140,
      cell: ({ getValue }) => (
        <StatusBadge
          status={getValue<string>()}
          colorMap={edoStatusColorMap}
          label={edoStatusLabels[getValue<string>()] ?? getValue<string>()}
        />
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: t('integrations.edo.colAmount'),
      size: 140,
      cell: ({ getValue }) => {
        const val = getValue<number>();
        return val > 0 ? (
          <span className="tabular-nums text-neutral-700 dark:text-neutral-300">{formatMoney(val)}</span>
        ) : (
          <span className="text-neutral-400">--</span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ row }) => {
        if (row.original.status === 'DELIVERED' || row.original.status === 'SIGNING') {
          return (
            <Button variant="ghost" size="xs" iconLeft={<PenTool size={12} />}
              onClick={() => handleSign(row.original.id)}>
              {t('integrations.edo.sign')}
            </Button>
          );
        }
        return null;
      },
    },
  ], [handleSign]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('integrations.edo.title')}
        subtitle={t('integrations.edo.subtitle')}
        breadcrumbs={[
          { label: t('integrations.edo.breadcrumbHome'), href: '/' },
          { label: t('integrations.edo.breadcrumbIntegrations'), href: '/integrations' },
          { label: t('integrations.edo.title') },
        ]}
        backTo="/integrations"
        actions={
          <Button iconLeft={<Send size={16} />} onClick={() => setShowSendModal(true)}>
            {t('integrations.edo.sendDocument')}
          </Button>
        }
        tabs={[
          { id: 'all', label: t('integrations.edo.tabAll'), count: tabCounts.all },
          { id: 'inbox', label: t('integrations.edo.tabInbox'), count: tabCounts.inbox },
          { id: 'outbox', label: t('integrations.edo.tabOutbox'), count: tabCounts.outbox },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* Status card */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <FileText size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
              {status.configured ? `${t('integrations.edo.provider')}: ${status.provider}` : t('integrations.edo.notConfigured')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {status.connected ? t('integrations.edo.connected') : t('integrations.edo.notConnected')}
            </p>
          </div>
          <StatusBadge
            status={status.connected ? 'ACTIVE' : 'INACTIVE'}
            colorMap={{ active: 'green', inactive: 'gray' }}
            label={status.connected ? t('integrations.edo.connected') : t('integrations.edo.notConnected')}
            size="sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCard icon={<FileText size={16} />} label={t('integrations.edo.metricTotalDocuments')} value={status.totalDocuments} />
          <MetricCard icon={<Clock size={16} />} label={t('integrations.edo.metricPendingSigning')} value={status.pendingDocuments} />
          <MetricCard icon={<CheckCircle2 size={16} />} label={t('integrations.edo.metricSigned')}
            value={documents.filter((d) => d.status === 'SIGNED').length} />
          <MetricCard icon={<XCircle size={16} />} label={t('integrations.edo.metricRejected')}
            value={documents.filter((d) => d.status === 'REJECTED').length} />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder={t('integrations.edo.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable<EdoDocumentRow>
        data={filtered}
        columns={columns}
        enableColumnVisibility
        enableDensityToggle
        enableExport
        pageSize={20}
        emptyTitle={t('integrations.edo.emptyTitle')}
        emptyDescription={t('integrations.edo.emptyDescription')}
      />

      {/* Send Document Modal */}
      <Modal
        open={showSendModal}
        onClose={() => setShowSendModal(false)}
        title={t('integrations.edo.sendDocumentTitle')}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSendModal(false)}>{t('integrations.edo.cancel')}</Button>
            <Button
              iconLeft={<Send size={14} />}
              loading={sendDocumentMutation.isPending}
              disabled={!sendForm.recipientInn.trim() || !sendForm.docNumber.trim() || !sendForm.docName.trim()}
              onClick={() => sendDocumentMutation.mutate(sendForm)}
            >
              {t('integrations.edo.sendBtn')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label={t('integrations.edo.fieldProvider')} required>
            <Select
              options={[
                { value: 'DIADOC', label: t('integrations.edo.providerDiadoc') },
                { value: 'SBIS', label: t('integrations.edo.providerSbis') },
                { value: 'KONTUR', label: t('integrations.edo.providerKontur') },
              ]}
              value={sendForm.provider}
              onChange={(e) => setSendForm((p) => ({ ...p, provider: e.target.value }))}
            />
          </FormField>
          <FormField label={t('integrations.edo.fieldDocType')} required>
            <Select
              options={[
                { value: 'UPD', label: t('integrations.edo.docTypeUpd') },
                { value: 'INVOICE', label: t('integrations.edo.docTypeInvoice') },
                { value: 'ACT', label: t('integrations.edo.docTypeAct') },
                { value: 'WAYBILL', label: t('integrations.edo.docTypeWaybill') },
                { value: 'CONTRACT', label: t('integrations.edo.docTypeContract') },
              ]}
              value={sendForm.docType}
              onChange={(e) => setSendForm((p) => ({ ...p, docType: e.target.value }))}
            />
          </FormField>
          <FormField label={t('integrations.edo.fieldRecipientInn')} required>
            <Input
              placeholder="7712345678"
              value={sendForm.recipientInn}
              onChange={(e) => setSendForm((p) => ({ ...p, recipientInn: e.target.value }))}
            />
          </FormField>
          <FormField label={t('integrations.edo.fieldDocNumber')} required>
            <Input
              placeholder={t('integrations.edo.placeholderDocNumber')}
              value={sendForm.docNumber}
              onChange={(e) => setSendForm((p) => ({ ...p, docNumber: e.target.value }))}
            />
          </FormField>
          <FormField label={t('integrations.edo.fieldDocName')} required>
            <Input
              placeholder={t('integrations.edo.placeholderDocName')}
              value={sendForm.docName}
              onChange={(e) => setSendForm((p) => ({ ...p, docName: e.target.value }))}
            />
          </FormField>
          <FormField label={t('integrations.edo.fieldAmount')}>
            <Input
              type="number"
              placeholder="0.00"
              value={sendForm.amount}
              onChange={(e) => setSendForm((p) => ({ ...p, amount: e.target.value }))}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
};

export default EdoSettingsPage;
