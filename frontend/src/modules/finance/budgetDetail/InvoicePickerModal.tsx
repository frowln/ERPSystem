import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { financeApi } from '@/api/finance';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { Invoice, InvoiceLine } from '@/types';

interface InvoicePickerProps {
  open: boolean;
  onClose: () => void;
  projectId: string | undefined;
  onSelect: (price: number, invoiceId: string, invoiceNumber: string, itemName: string) => void;
}

const InvoicePickerModal: React.FC<InvoicePickerProps> = ({ open, onClose, projectId, onSelect }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingLines, setLoadingLines] = useState(false);
  const [invoiceLines, setInvoiceLines] = useState<Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    unitOfMeasure?: string;
  }>>([]);

  const { data: invoicesPage, isLoading } = useQuery({
    queryKey: ['invoices-for-budget-price', projectId],
    queryFn: () => financeApi.getInvoices({ projectId, invoiceType: 'RECEIVED', size: 100, page: 0 }),
    enabled: open && !!projectId,
  });

  const invoices: Invoice[] = invoicesPage?.content ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return invoices;
    const q = search.toLowerCase();
    return invoices.filter((invoice) =>
      invoice.number?.toLowerCase().includes(q)
      || invoice.partnerName?.toLowerCase().includes(q)
      || invoice.id.toLowerCase().includes(q));
  }, [invoices, search]);

  const handleExpand = async (invoice: Invoice) => {
    if (expandedId === invoice.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(invoice.id);
    setLoadingLines(true);
    try {
      const lines = await financeApi.getInvoiceLines(invoice.id);
      setInvoiceLines(lines.map((line) => ({
        id: line.id,
        name: line.name,
        quantity: Number(line.quantity ?? 0),
        unitPrice: Number(line.unitPrice ?? 0),
        amount: Number(line.amount ?? 0),
        unitOfMeasure: line.unitOfMeasure,
      })));
    } catch {
      setInvoiceLines([]);
    } finally {
      setLoadingLines(false);
    }
  };

  const handleSelectLine = (invoice: Invoice, line: { unitPrice: number; name: string }) => {
    if (!line.unitPrice) {
      toast.error(t('finance.errorNoPriceInInvoice'));
      return;
    }
    onSelect(line.unitPrice, invoice.id, invoice.number, line.name);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('finance.pickPriceFromInvoice')} size="xl">
      <div className="space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('finance.searchInvoice')}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-neutral-400">
            {search ? t('finance.invoicesNotFound') : t('finance.noInvoicesForProject')}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
            {filtered.map((invoice) => (
              <div key={invoice.id}>
                <button
                  onClick={() => handleExpand(invoice)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left group"
                >
                  {expandedId === invoice.id ? <ChevronDown size={14} className="shrink-0 text-neutral-400" /> : <ChevronRight size={14} className="shrink-0 text-neutral-400" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {invoice.number}
                    </p>
                    <p className="text-xs text-neutral-400 truncate">
                      {invoice.partnerName} · {invoice.invoiceDate} · {formatMoney(invoice.totalAmount ?? 0)}
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                    {invoice.status}
                  </span>
                </button>

                {expandedId === invoice.id && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/40 border-t border-neutral-100 dark:border-neutral-700">
                    {loadingLines ? (
                      <div className="px-4 py-3 text-xs text-neutral-400">{t('finance.loadingInvoiceLines')}</div>
                    ) : invoiceLines.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-neutral-400">{t('finance.noInvoiceLines')}</div>
                    ) : (
                      invoiceLines.map((line) => (
                        <div key={line.id} className="flex items-center gap-3 px-6 py-2.5 border-b border-neutral-100 dark:border-neutral-700 last:border-0 hover:bg-white dark:hover:bg-neutral-800">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{line.name}</p>
                            <p className="text-xs text-neutral-400">{line.quantity} {line.unitOfMeasure ?? 'шт'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                              {line.unitPrice ? formatMoney(line.unitPrice) : <span className="text-neutral-300">—</span>}
                            </p>
                            <p className="text-xs text-neutral-400">{t('finance.perUnit')}</p>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSelectLine(invoice, line)}
                            disabled={!line.unitPrice}
                          >
                            {t('common.select')}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.close')}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoicePickerModal;
