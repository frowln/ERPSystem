import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { cn } from '@/lib/cn';
import { formatMoney, formatDate } from '@/lib/format';
import { t } from '@/i18n';
import type { Payment } from '@/types';
import { TABLE_HEADER_CLS, TABLE_HEADER_RIGHT_CLS } from './types';

interface PaymentsSectionProps {
  projectId: string | undefined;
  payments: Payment[];
}

export const PaymentsSection = React.memo<PaymentsSectionProps>(({
  projectId,
  payments,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('projects.finance.cashFlowSection')}
        </h3>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" iconRight={<ArrowUpRight size={13} />} onClick={() => navigate(`/invoices?projectId=${projectId}`)}>
            {t('projects.finance.invoicesTab')}
          </Button>
          <Button variant="secondary" size="sm" iconRight={<ArrowUpRight size={13} />} onClick={() => navigate(`/payments?projectId=${projectId}`)}>
            {t('projects.finance.paymentsTab')}
          </Button>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
            <th className={TABLE_HEADER_CLS}>{t('projects.finance.headerDate')}</th>
            <th className={TABLE_HEADER_CLS}>{t('projects.finance.colType')}</th>
            <th className={TABLE_HEADER_CLS}>{t('projects.finance.headerCounterparty')}</th>
            <th className={TABLE_HEADER_CLS}>{t('projects.finance.headerDocument')}</th>
            <th className={TABLE_HEADER_RIGHT_CLS}>{t('projects.finance.headerAmount')}</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-400">
                {t('projects.finance.noCashFlowData')}
              </td>
            </tr>
          )}
          {payments.map((pay) => (
            <tr
              key={pay.id}
              className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
              onClick={() => navigate(`/payments/${pay.id}`)}
            >
              <td className="px-5 py-3 text-sm tabular-nums text-neutral-600">{formatDate(pay.paymentDate)}</td>
              <td className="px-5 py-3 text-sm">
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                  pay.paymentType === 'INCOMING'
                    ? 'bg-success-50 text-success-700'
                    : 'bg-danger-50 text-danger-700',
                )}>
                  {pay.paymentType === 'INCOMING' ? `\u2193 ${t('projects.finance.incoming')}` : `\u2191 ${t('projects.finance.payment')}`}
                </span>
              </td>
              <td className="px-5 py-3 text-sm text-neutral-600 truncate max-w-[160px]">{pay.partnerName ?? '\u2014'}</td>
              <td className="px-5 py-3 text-xs font-mono text-neutral-500 dark:text-neutral-400">{pay.number}</td>
              <td className={cn(
                'px-5 py-3 text-sm font-semibold tabular-nums text-right',
                pay.paymentType === 'INCOMING' ? 'text-success-700' : 'text-danger-700',
              )}>
                {pay.paymentType === 'INCOMING' ? '+' : '\u2212'}{formatMoney(pay.totalAmount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

PaymentsSection.displayName = 'PaymentsSection';
