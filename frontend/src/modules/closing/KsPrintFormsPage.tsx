import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Printer,
  Download,
  FileText,
  FileSpreadsheet,
  Eye,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Select } from '@/design-system/components/FormField';
import { closingApi } from '@/api/closing';
import { formatMoney, formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { Ks2PrintData, Ks3PrintData } from './types';

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type PrintTab = 'ks2' | 'ks3';

// ---------------------------------------------------------------------------
// KS-2 Print Preview
// ---------------------------------------------------------------------------

const Ks2PrintPreview: React.FC<{ data: Ks2PrintData }> = ({ data }) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 print:border-none print:shadow-none print:p-0">
    {/* Header */}
    <div className="text-center mb-6">
      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
        {t('closing.printForms.ks2FormTitle')}
      </p>
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
        {t('closing.printForms.ks2ActTitle', { number: data.actNumber })}
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
        {t('closing.printForms.dateLabel')}: {formatDate(data.date)}
      </p>
    </div>

    {/* Parties */}
    <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          {t('closing.printForms.contractor')}
        </p>
        <p className="font-medium text-neutral-900 dark:text-neutral-100">{data.contractor}</p>
      </div>
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          {t('closing.printForms.client')}
        </p>
        <p className="font-medium text-neutral-900 dark:text-neutral-100">{data.client}</p>
      </div>
    </div>

    {/* Object */}
    <div className="mb-6">
      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
        {t('closing.printForms.object')}
      </p>
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{data.object}</p>
    </div>

    {/* Work items table */}
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-neutral-50 dark:bg-neutral-800">
            <th className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-center text-xs font-medium text-neutral-600 dark:text-neutral-400 w-12">
              {t('closing.printForms.colRowNum')}
            </th>
            <th className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {t('closing.printForms.colWorkName')}
            </th>
            <th className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-center text-xs font-medium text-neutral-600 dark:text-neutral-400 w-16">
              {t('closing.printForms.colUnit')}
            </th>
            <th className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-right text-xs font-medium text-neutral-600 dark:text-neutral-400 w-20">
              {t('closing.printForms.colQty')}
            </th>
            <th className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-right text-xs font-medium text-neutral-600 dark:text-neutral-400 w-28">
              {t('closing.printForms.colPrice')}
            </th>
            <th className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-right text-xs font-medium text-neutral-600 dark:text-neutral-400 w-32">
              {t('closing.printForms.colAmount')}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr
              key={item.number}
              className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
            >
              <td className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-center tabular-nums text-neutral-500 dark:text-neutral-400">
                {item.number}
              </td>
              <td className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-neutral-800 dark:text-neutral-200">
                {item.workName}
              </td>
              <td className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-center text-neutral-500 dark:text-neutral-400 text-xs">
                {item.unit}
              </td>
              <td className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-right tabular-nums">
                {formatNumber(item.qty)}
              </td>
              <td className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-right tabular-nums">
                {formatMoney(item.price)}
              </td>
              <td className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-right tabular-nums font-medium">
                {formatMoney(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-neutral-50 dark:bg-neutral-800 font-semibold">
            <td
              colSpan={5}
              className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-right text-xs uppercase tracking-wider text-neutral-600 dark:text-neutral-400"
            >
              {t('closing.printForms.totalLabel')}
            </td>
            <td className="border border-neutral-200 dark:border-neutral-700 px-3 py-2 text-right tabular-nums text-primary-700 dark:text-primary-400 text-base">
              {formatMoney(data.total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    {/* Signatures placeholder */}
    <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-700">
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
          {t('closing.printForms.signatureContractor')}
        </p>
        <div className="border-b border-neutral-300 dark:border-neutral-600 w-48" />
      </div>
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
          {t('closing.printForms.signatureClient')}
        </p>
        <div className="border-b border-neutral-300 dark:border-neutral-600 w-48" />
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// KS-3 Print Preview
// ---------------------------------------------------------------------------

const Ks3PrintPreview: React.FC<{ data: Ks3PrintData }> = ({ data }) => (
  <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 print:border-none print:shadow-none print:p-0">
    {/* Header */}
    <div className="text-center mb-6">
      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
        {t('closing.printForms.ks3FormTitle')}
      </p>
      <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
        {t('closing.printForms.ks3CertTitle', { number: data.certificateNumber })}
      </h2>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
        {t('closing.printForms.dateLabel')}: {formatDate(data.date)}
      </p>
    </div>

    {/* Parties */}
    <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          {t('closing.printForms.contractor')}
        </p>
        <p className="font-medium text-neutral-900 dark:text-neutral-100">{data.contractor}</p>
      </div>
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
        <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
          {t('closing.printForms.client')}
        </p>
        <p className="font-medium text-neutral-900 dark:text-neutral-100">{data.client}</p>
      </div>
    </div>

    {/* Contract info */}
    <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
          {t('closing.printForms.contractNumber')}
        </p>
        <p className="font-medium text-neutral-900 dark:text-neutral-100">
          {data.contractNumber}
        </p>
      </div>
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
          {t('closing.printForms.contractDate')}
        </p>
        <p className="font-medium text-neutral-900 dark:text-neutral-100">
          {formatDate(data.contractDate)}
        </p>
      </div>
    </div>

    {/* Period */}
    <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
        {t('closing.printForms.reportingPeriod')}
      </p>
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {formatDate(data.periodFrom)} &mdash; {formatDate(data.periodTo)}
      </p>
    </div>

    {/* Cost table */}
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-neutral-50 dark:bg-neutral-800">
            <th className="border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-left text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {t('closing.printForms.ks3ColDescription')}
            </th>
            <th className="border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-right text-xs font-medium text-neutral-600 dark:text-neutral-400 w-40">
              {t('closing.printForms.ks3ColAmount')}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-neutral-800 dark:text-neutral-200">
              {t('closing.printForms.ks3CompletedFromStart')}
            </td>
            <td className="border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-right tabular-nums font-medium">
              {formatMoney(data.completedFromStart)}
            </td>
          </tr>
          <tr className="bg-primary-50/30 dark:bg-primary-900/10">
            <td className="border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-neutral-800 dark:text-neutral-200 font-medium">
              {t('closing.printForms.ks3CompletedThisPeriod')}
            </td>
            <td className="border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-right tabular-nums font-semibold text-primary-700 dark:text-primary-400">
              {formatMoney(data.completedThisPeriod)}
            </td>
          </tr>
          <tr className="bg-neutral-50 dark:bg-neutral-800 font-semibold">
            <td className="border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-neutral-800 dark:text-neutral-200">
              {t('closing.printForms.ks3CompletedTotal')}
            </td>
            <td className="border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-right tabular-nums text-primary-700 dark:text-primary-400 text-base">
              {formatMoney(data.completedFromStartTotal)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    {/* Signatures placeholder */}
    <div className="grid grid-cols-2 gap-8 mt-10 pt-6 border-t border-neutral-200 dark:border-neutral-700">
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
          {t('closing.printForms.signatureContractor')}
        </p>
        <div className="border-b border-neutral-300 dark:border-neutral-600 w-48" />
      </div>
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
          {t('closing.printForms.signatureClient')}
        </p>
        <div className="border-b border-neutral-300 dark:border-neutral-600 w-48" />
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const KsPrintFormsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PrintTab>('ks2');
  const [selectedActId, setSelectedActId] = useState('');

  // Fetch list of KS-2 and KS-3 docs for selection
  const { data: ks2List } = useQuery({
    queryKey: ['ks2-documents-select'],
    queryFn: () => closingApi.getKs2Documents({ size: 200 }),
  });

  const { data: ks3List } = useQuery({
    queryKey: ['ks3-documents-select'],
    queryFn: () => closingApi.getKs3Documents({ size: 200 }),
  });

  const ks2Options = (ks2List?.content ?? []).map((doc) => ({
    value: doc.id,
    label: `${doc.number} - ${doc.name}`,
  }));

  const ks3Options = (ks3List?.content ?? []).map((doc) => ({
    value: doc.id,
    label: `${doc.number} - ${doc.name}`,
  }));

  const options = activeTab === 'ks2' ? ks2Options : ks3Options;

  // Fetch print data
  const { data: ks2PrintData, isLoading: ks2Loading } = useQuery<Ks2PrintData>({
    queryKey: ['ks2-print', selectedActId],
    queryFn: () => closingApi.getKs2PrintData(selectedActId),
    enabled: activeTab === 'ks2' && !!selectedActId,
  });

  const { data: ks3PrintData, isLoading: ks3Loading } = useQuery<Ks3PrintData>({
    queryKey: ['ks3-print', selectedActId],
    queryFn: () => closingApi.getKs3PrintData(selectedActId),
    enabled: activeTab === 'ks3' && !!selectedActId,
  });

  const isLoading = activeTab === 'ks2' ? ks2Loading : ks3Loading;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    toast.success(t('closing.printForms.toastPdfExport'));
  };

  const handleExport1C = () => {
    toast.success(t('closing.printForms.toastOneCExport'));
  };

  const handleTabChange = (tab: PrintTab) => {
    setActiveTab(tab);
    setSelectedActId('');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('closing.printForms.title')}
        subtitle={t('closing.printForms.subtitle')}
        breadcrumbs={[
          { label: t('closing.ks2.breadcrumbHome'), href: '/' },
          { label: t('closing.printForms.breadcrumb') },
        ]}
        tabs={[
          { id: 'ks2', label: t('closing.printForms.tabKs2') },
          { id: 'ks3', label: t('closing.printForms.tabKs3') },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => handleTabChange(id as PrintTab)}
        actions={
          selectedActId ? (
            <div className="flex items-center gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer size={14} className="mr-1" />
                {t('closing.printForms.actionPrint')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPdf}>
                <Download size={14} className="mr-1" />
                {t('closing.printForms.actionExportPdf')}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport1C}>
                <FileSpreadsheet size={14} className="mr-1" />
                {t('closing.printForms.actionExport1C')}
              </Button>
            </div>
          ) : null
        }
      />

      {/* Selector */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <FileText size={16} className="text-neutral-400" />
        <div className="w-full max-w-md">
          <Select
            options={options}
            value={selectedActId}
            onChange={(e) => setSelectedActId(e.target.value)}
            placeholder={
              activeTab === 'ks2'
                ? t('closing.printForms.selectKs2')
                : t('closing.printForms.selectKs3')
            }
          />
        </div>
      </div>

      {/* Preview or empty state */}
      {selectedActId ? (
        isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'ks2' && ks2PrintData ? (
          <Ks2PrintPreview data={ks2PrintData} />
        ) : activeTab === 'ks3' && ks3PrintData ? (
          <Ks3PrintPreview data={ks3PrintData} />
        ) : null
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center print:hidden">
          <Eye size={48} className="text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('closing.printForms.selectDocHint')}
          </p>
        </div>
      )}
    </div>
  );
};

export default KsPrintFormsPage;
