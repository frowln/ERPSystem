import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, ExternalLink, ChevronDown, ChevronRight, Receipt,
} from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { cn } from '@/lib/cn';
import { formatMoneyWhole } from '@/lib/format';
import { t } from '@/i18n';
import type { Contract } from '@/types';
import type { ComputedFinancials } from '../hooks/useProjectFinancials';
import type { ChangeOrder } from './types';
import { CONTRACT_TYPE_LABELS, CONTRACT_TYPE_ORDER, TABLE_HEADER_CLS, TABLE_HEADER_RIGHT_CLS } from './types';
import { AmountCell, SectionHeader, TotalRow } from './TablePrimitives';

interface ContractsBreakdownSectionProps {
  projectId: string | undefined;
  revenueContracts: Contract[];
  expenseContracts: Contract[];
  contractsByType: Map<string, Contract[]>;
  changeOrders: ChangeOrder[];
  revenueTotals: { contractAmount: number; totalWithVat: number; invoiced: number; paid: number; receivable: number };
  expenseTotals: { contractAmount: number; totalWithVat: number; invoiced: number; paid: number; receivable: number };
  computed: ComputedFinancials;
  issuedInvoiceCount: number;
  expandedContractRows: Set<string>;
  toggleContractRow: (id: string) => void;
  onExportExcel: () => void;
}

export const ContractsBreakdownSection = React.memo<ContractsBreakdownSectionProps>(({
  projectId,
  revenueContracts,
  expenseContracts,
  contractsByType,
  changeOrders,
  revenueTotals,
  expenseTotals,
  computed: f,
  issuedInvoiceCount,
  expandedContractRows,
  toggleContractRow,
  onExportExcel,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t('projects.finance.financialBreakdown')}
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">{t('projects.finance.financialBreakdownDesc')}</p>
        </div>
        <Button variant="secondary" size="sm" iconLeft={<Download size={13} />} onClick={onExportExcel}>
          Excel
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
              <th className={TABLE_HEADER_CLS} style={{ width: '28%' }}>{t('projects.finance.colContractItem')}</th>
              <th className={TABLE_HEADER_CLS} style={{ width: '14%' }}>{t('projects.finance.colCounterparty')}</th>
              <th className={TABLE_HEADER_CLS} style={{ width: '8%' }}>{t('projects.finance.colType')}</th>
              <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colContractAmount')}</th>
              <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colWithVat')}</th>
              <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colInvoiced')}</th>
              <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colPaid')}</th>
              <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.colBalance')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">

            {/* REVENUE SECTION */}
            <SectionHeader label={t('projects.finance.revenueFromClient')} />
            {revenueContracts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-3 text-sm text-neutral-400 italic">{t('projects.finance.noClientContracts')}</td>
              </tr>
            )}
            {revenueContracts.map((c) => (
              <React.Fragment key={c.id}>
                <tr
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer"
                  onClick={() => navigate(`/contracts/${c.id}`)}
                >
                  <td className="px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-1.5">
                      <ExternalLink size={12} className="text-neutral-400 shrink-0" />
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{c.number}</span>
                      <span className="text-neutral-500 truncate max-w-[160px]">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-neutral-600 truncate max-w-[120px]">{c.partnerName ?? '\u2014'}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success-50 text-success-700">
                      {t('projects.finance.gk')}
                    </span>
                  </td>
                  <AmountCell value={c.amount ?? 0} />
                  <AmountCell value={c.totalWithVat ?? 0} />
                  <AmountCell value={f.invoicedToCustomer} success />
                  <AmountCell value={f.receivedPayments} success />
                  <AmountCell value={Math.max(0, f.invoicedToCustomer - f.receivedPayments)} danger={f.accountsReceivable > 0} />
                </tr>
                {/* Change orders for this revenue contract */}
                {changeOrders.filter((co) => co.contractId === c.id && ['APPROVED', 'EXECUTED'].includes(co.status)).map((co) => (
                  <tr key={co.id} className="bg-success-50/20 border-b border-success-100">
                    <td className="px-4 py-1.5 text-sm pl-10">
                      <div className="flex items-center gap-1.5 text-success-700">
                        <span className="text-xs font-medium text-success-600">{t('projects.finance.dsShort')}</span>
                        <span className="text-xs text-neutral-600">{co.number} &mdash; {co.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-1.5 text-xs text-neutral-400 italic">{t('projects.finance.supplementaryAgreement')}</td>
                    <td className="px-4 py-1.5">
                      <span className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                        co.status === 'EXECUTED' ? 'bg-success-100 text-success-700' : 'bg-primary-50 text-primary-700',
                      )}>
                        {co.status === 'EXECUTED' ? t('projects.finance.executed') : t('projects.finance.approved')}
                      </span>
                    </td>
                    <td className="px-4 py-1.5 text-sm tabular-nums text-right text-success-700 font-medium">
                      +{formatMoneyWhole(co.totalAmount)}
                    </td>
                    <td colSpan={4} className="px-4 py-1.5 text-xs text-neutral-400">
                      {t('projects.finance.revisedAmount')}: {formatMoneyWhole(co.revisedContractAmount ?? (c.amount + co.totalAmount))}
                    </td>
                  </tr>
                ))}
                {/* Pending COs for this contract */}
                {changeOrders.filter((co) => co.contractId === c.id && co.status === 'PENDING_APPROVAL').map((co) => (
                  <tr key={co.id} className="bg-warning-50/20 border-b border-warning-100">
                    <td className="px-4 py-1.5 text-sm pl-10">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-warning-600">{t('projects.finance.dsPending')}</span>
                        <span className="text-xs text-neutral-500">{co.number} &mdash; {co.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-1.5 text-xs text-neutral-400 italic">{t('projects.finance.underApproval')}</td>
                    <td className="px-4 py-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-warning-50 text-warning-700">{t('projects.finance.pendingApproval')}</span>
                    </td>
                    <td className="px-4 py-1.5 text-sm tabular-nums text-right text-warning-600 font-medium">
                      +{formatMoneyWhole(co.totalAmount)}
                    </td>
                    <td colSpan={4} className="px-4 py-1.5 text-xs text-neutral-400">
                      {t('projects.finance.ifApproved')}: {formatMoneyWhole((co.revisedContractAmount ?? (c.amount + co.totalAmount)))}
                    </td>
                  </tr>
                ))}
                {/* Invoices button row */}
                <tr className="bg-success-50/30">
                  <td colSpan={8} className="px-8 py-1.5">
                    <button
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                      onClick={() => navigate(`/invoices?projectId=${projectId}&invoiceType=ISSUED`)}
                    >
                      <Receipt size={11} />
                      {t('projects.finance.clientInvoices')}{issuedInvoiceCount > 0 ? ` (${issuedInvoiceCount} ${t('projects.finance.pcs')})` : ''} &rarr;
                    </button>
                  </td>
                </tr>
              </React.Fragment>
            ))}
            <TotalRow
              label={t('projects.finance.totalRevenue')}
              contractAmount={revenueTotals.contractAmount}
              totalWithVat={revenueTotals.totalWithVat}
              invoiced={revenueTotals.invoiced}
              paid={revenueTotals.paid}
              receivable={revenueTotals.receivable}
              bold
              className="bg-success-50/40 dark:bg-success-900/10"
            />

            {/* Spacing */}
            <tr><td colSpan={8} className="h-2 bg-neutral-50 dark:bg-neutral-800/40" /></tr>

            {/* EXPENSES BY CONTRACT TYPE */}
            <SectionHeader label={t('projects.finance.expensesByContracts')} />
            {expenseContracts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-3 text-sm text-neutral-400 italic">{t('projects.finance.noSupplierContracts')}</td>
              </tr>
            )}
            {CONTRACT_TYPE_ORDER.filter((code) => code !== 'GENERAL' && contractsByType.has(code)).map((typeCode) => {
              const group = contractsByType.get(typeCode) ?? [];
              const groupTotal = group.reduce((s, c) => s + (c.amount ?? 0), 0);
              const groupInvoiced = group.reduce((s, c) => s + (c.totalInvoiced ?? 0), 0);
              const groupPaid = group.reduce((s, c) => s + (c.totalPaid ?? 0), 0);
              const isExpanded = expandedContractRows.has(typeCode);

              return (
                <React.Fragment key={typeCode}>
                  {/* Type group header */}
                  <tr
                    className="bg-neutral-50/80 dark:bg-neutral-800/60 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={() => toggleContractRow(typeCode)}
                  >
                    <td className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400" colSpan={3}>
                      <div className="flex items-center gap-1.5">
                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        {CONTRACT_TYPE_LABELS[typeCode] ?? typeCode}
                        <span className="text-neutral-400">({group.length})</span>
                      </div>
                    </td>
                    <AmountCell value={groupTotal} bold />
                    <AmountCell value={group.reduce((s, c) => s + (c.totalWithVat ?? 0), 0)} />
                    <AmountCell value={groupInvoiced} />
                    <AmountCell value={groupPaid} />
                    <AmountCell value={Math.max(0, groupInvoiced - groupPaid)} danger={groupInvoiced > groupPaid} />
                  </tr>
                  {/* Individual contracts */}
                  {isExpanded && group.map((c) => (
                    <React.Fragment key={c.id}>
                      <tr
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer"
                        onClick={() => navigate(`/contracts/${c.id}`)}
                      >
                        <td className="px-4 py-2.5 text-sm pl-10">
                          <div className="flex items-center gap-1.5">
                            <ExternalLink size={12} className="text-neutral-400 shrink-0" />
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{c.number}</span>
                            <span className="text-neutral-500 truncate max-w-[140px]">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-neutral-600 truncate max-w-[120px]">{c.partnerName ?? '\u2014'}</td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={c.status} size="sm" />
                        </td>
                        <AmountCell value={c.amount ?? 0} />
                        <AmountCell value={c.totalWithVat ?? 0} />
                        <AmountCell value={c.totalInvoiced ?? 0} />
                        <AmountCell value={c.totalPaid ?? 0} />
                        <AmountCell
                          value={Math.max(0, (c.totalInvoiced ?? 0) - (c.totalPaid ?? 0))}
                          danger={(c.totalInvoiced ?? 0) > (c.totalPaid ?? 0)}
                        />
                      </tr>
                      {/* Change orders for this expense contract */}
                      {changeOrders.filter((co) => co.contractId === c.id && ['APPROVED', 'EXECUTED'].includes(co.status)).map((co) => (
                        <tr key={co.id} className="bg-neutral-50/60 border-b border-neutral-100">
                          <td className="px-4 py-1 text-sm pl-14">
                            <div className="flex items-center gap-1.5 text-neutral-500">
                              <span className="text-xs font-medium text-primary-600">{t('projects.finance.dsShort')}</span>
                              <span className="text-xs">{co.number} &mdash; {co.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-1 text-xs text-neutral-400 italic">{t('projects.finance.supplementaryAgreement')}</td>
                          <td className="px-4 py-1">
                            <span className={cn(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
                              co.status === 'EXECUTED' ? 'bg-success-50 text-success-700' : 'bg-primary-50 text-primary-700',
                            )}>
                              {co.status === 'EXECUTED' ? t('projects.finance.executed') : t('projects.finance.approved')}
                            </span>
                          </td>
                          <td className="px-4 py-1 text-xs tabular-nums text-right text-primary-600 font-medium">
                            +{formatMoneyWhole(co.totalAmount)}
                          </td>
                          <td colSpan={4} className="px-4 py-1 text-xs text-neutral-400">
                            &rarr; {t('projects.finance.total')}: {formatMoneyWhole(co.revisedContractAmount ?? ((c.amount ?? 0) + co.totalAmount))}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              );
            })}
            <TotalRow
              label={t('projects.finance.totalExpensesByContracts')}
              contractAmount={expenseTotals.contractAmount}
              totalWithVat={expenseTotals.totalWithVat}
              invoiced={expenseTotals.invoiced}
              paid={expenseTotals.paid}
              receivable={expenseTotals.receivable}
              bold
              className="bg-danger-50/30 dark:bg-danger-900/10"
            />

          </tbody>
        </table>
      </div>
    </div>
  );
});

ContractsBreakdownSection.displayName = 'ContractsBreakdownSection';
