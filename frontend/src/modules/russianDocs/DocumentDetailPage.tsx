import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Send, CheckCircle, FileText, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import {
  StatusBadge,
  russianDocStatusColorMap,
  russianDocStatusLabels,
  russianDocTypeColorMap,
  russianDocTypeLabels,
} from '@/design-system/components/StatusBadge';
import { russianDocsApi } from '@/api/russianDocs';
import { formatDate, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { Ks2Line, RussianDocument } from './types';

const DocumentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: ({ docId, status }: { docId: string; status: string }) =>
      russianDocsApi.changeStatus(docId, status as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['russian-doc', id] });
      queryClient.invalidateQueries({ queryKey: ['russian-docs'] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const exportMutation = useMutation({
    mutationFn: ({ docId, format }: { docId: string; format: 'pdf' | 'xlsx' }) =>
      russianDocsApi.exportDocument(docId, format),
    onSuccess: (blob, { format }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const { data: docData } = useQuery<RussianDocument>({
    queryKey: ['russian-doc', id],
    queryFn: () => russianDocsApi.getDocument(id!),
    enabled: !!id,
  });

  const { data: ks2LinesData } = useQuery<Ks2Line[]>({
    queryKey: ['russian-doc-ks2-lines', id],
    queryFn: () => russianDocsApi.getKs2Lines(id!),
    enabled: !!id,
  });

  const defaultDoc: RussianDocument = {
    id: id ?? '',
    number: '',
    name: '',
    documentType: 'KS2',
    status: 'DRAFT',
    projectId: '',
    projectName: '',
    documentDate: '',
    totalAmount: 0,
    vatAmount: 0,
    totalWithVat: 0,
    customerName: '',
    contractorName: '',
    lineCount: 0,
    createdById: '',
    createdByName: '',
    createdAt: '',
    updatedAt: '',
  };

  const doc = docData ?? defaultDoc;
  const ks2Lines = ks2LinesData ?? [];

  const statusActions = useMemo(() => {
    switch (doc.status) {
      case 'DRAFT':
        return (
          <Button iconLeft={<Send size={16} />} onClick={() => statusMutation.mutate({ docId: id!, status: 'IN_REVIEW' })}>
            {t('russianDocs.docDetailToReview')}
          </Button>
        );
      case 'IN_REVIEW':
        return (
          <Button iconLeft={<CheckCircle size={16} />} onClick={() => statusMutation.mutate({ docId: id!, status: 'ON_SIGNING' })}>
            {t('russianDocs.docDetailToSigning')}
          </Button>
        );
      case 'ON_SIGNING':
        return (
          <Button iconLeft={<CheckCircle size={16} />} onClick={() => statusMutation.mutate({ docId: id!, status: 'SIGNED' })}>
            {t('russianDocs.sign')}
          </Button>
        );
      default:
        return null;
    }
  }, [doc.status, id, statusMutation]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={doc.number}
        subtitle={doc.name}
        breadcrumbs={[
          { label: t('russianDocs.breadcrumbHome'), href: '/' },
          { label: t('russianDocs.breadcrumbExecDocs'), href: '/russian-docs' },
          { label: doc.number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" iconLeft={<ArrowLeft size={16} />} onClick={() => navigate('/russian-docs')}>
              {t('russianDocs.back')}
            </Button>
            <Button variant="secondary" iconLeft={<Printer size={16} />} onClick={() => window.print()}>
              {t('russianDocs.print')}
            </Button>
            <Button variant="secondary" iconLeft={<Download size={16} />} onClick={() => exportMutation.mutate({ docId: id!, format: 'pdf' })}>
              {t('russianDocs.export')}
            </Button>
            {statusActions}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('russianDocs.docDetailInfo')}</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailDocType')}</p>
                <div className="mt-1">
                  <StatusBadge
                    status={doc.documentType}
                    colorMap={russianDocTypeColorMap}
                    label={russianDocTypeLabels[doc.documentType]}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('russianDocs.status')}</p>
                <div className="mt-1">
                  <StatusBadge
                    status={doc.status}
                    colorMap={russianDocStatusColorMap}
                    label={russianDocStatusLabels[doc.status]}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailProject')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-1">{doc.projectName}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailContract')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-1">{doc.contractName ?? '---'}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailDocDate')}</p>
                <p className="text-sm tabular-nums text-neutral-900 dark:text-neutral-100 mt-1">{formatDate(doc.documentDate)}</p>
              </div>
              {doc.periodFrom && (
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailReportPeriod')}</p>
                  <p className="text-sm tabular-nums text-neutral-900 dark:text-neutral-100 mt-1">
                    {formatDate(doc.periodFrom)} — {formatDate(doc.periodTo)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* KS-2 lines */}
          {doc.documentType === 'KS2' && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('russianDocs.docDetailWorkTypes')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700">
                      <th className="text-left py-2 pr-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('russianDocs.number')}</th>
                      <th className="text-left py-2 pr-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailWorkName')}</th>
                      <th className="text-left py-2 pr-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailUnit')}</th>
                      <th className="text-right py-2 pr-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailQuantity')}</th>
                      <th className="text-right py-2 pr-3 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailPrice')}</th>
                      <th className="text-right py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">{t('russianDocs.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ks2Lines.map((line) => (
                      <tr key={line.id} className="border-b border-neutral-100">
                        <td className="py-2 pr-3 text-neutral-500 dark:text-neutral-400 tabular-nums">{line.sequence}</td>
                        <td className="py-2 pr-3 text-neutral-900 dark:text-neutral-100">{line.workName}</td>
                        <td className="py-2 pr-3 text-neutral-600">{line.unitOfMeasure}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{line.quantity.toLocaleString('ru-RU')}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{formatMoney(line.unitPrice)}</td>
                        <td className="py-2 text-right tabular-nums font-medium">{formatMoney(line.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-neutral-300 dark:border-neutral-600">
                      <td colSpan={5} className="py-2 pr-3 font-semibold text-neutral-900 dark:text-neutral-100">{t('russianDocs.total')}</td>
                      <td className="py-2 text-right tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">{formatMoney(doc.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {doc.notes && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{t('russianDocs.docDetailNotes')}</h3>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{doc.notes}</p>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('russianDocs.docDetailAmounts')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailAmountNoVat')}</span>
                <span className="text-sm font-medium tabular-nums">{formatMoney(doc.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailVat20')}</span>
                <span className="text-sm font-medium tabular-nums">{formatMoney(doc.vatAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('russianDocs.docDetailAmountWithVat')}</span>
                <span className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{formatMoney(doc.totalWithVat)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('russianDocs.docDetailParties')}</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('russianDocs.customer')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{doc.customerName}</p>
                {doc.signatoryCustomer && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('russianDocs.docDetailSignatory')}: {doc.signatoryCustomer}</p>}
              </div>
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('russianDocs.contractor')}</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{doc.contractorName}</p>
                {doc.signatoryContractor && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('russianDocs.docDetailSignatory')}: {doc.signatoryContractor}</p>}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('russianDocs.docDetailServiceInfo')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailCreatedBy')}</span>
                <span className="text-neutral-900 dark:text-neutral-100">{doc.createdByName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailCreatedAt')}</span>
                <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{formatDate(doc.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailUpdatedAt')}</span>
                <span className="text-neutral-700 dark:text-neutral-300 tabular-nums">{formatDate(doc.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">{t('russianDocs.docDetailLines')}</span>
                <span className="text-neutral-700 dark:text-neutral-300">{doc.lineCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetailPage;
