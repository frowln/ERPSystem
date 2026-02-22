import React from 'react';
import { cn } from '@/lib/cn';
import { formatMoneyWhole } from '@/lib/format';

// ─── AmountCell ─────────────────────────────────────────────────────────────

interface AmountCellProps {
  value: number;
  muted?: boolean;
  bold?: boolean;
  danger?: boolean;
  success?: boolean;
}

export const AmountCell: React.FC<AmountCellProps> = ({
  value, muted, bold, danger, success,
}) => (
  <td className={cn(
    'px-4 py-2.5 text-sm tabular-nums text-right',
    muted && 'text-neutral-400',
    bold && 'font-semibold',
    danger && 'text-danger-600',
    success && 'text-success-700',
    !muted && !danger && !success && 'text-neutral-800 dark:text-neutral-200',
  )}>
    {value === 0 ? <span className="text-neutral-300">&mdash;</span> : formatMoneyWhole(value)}
  </td>
);

// ─── SectionHeader ──────────────────────────────────────────────────────────

interface SectionHeaderProps {
  label: string;
  colSpan?: number;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ label, colSpan = 8, className }) => (
  <tr>
    <td colSpan={colSpan} className={cn(
      'px-4 py-2 text-xs font-bold uppercase tracking-wider text-neutral-500 bg-neutral-50 dark:bg-neutral-800',
      className,
    )}>
      {label}
    </td>
  </tr>
);

// ─── TotalRow ───────────────────────────────────────────────────────────────

interface TotalRowProps {
  label: string;
  contractAmount: number;
  totalWithVat: number;
  invoiced: number;
  paid: number;
  receivable: number;
  bold?: boolean;
  className?: string;
}

export const TotalRow: React.FC<TotalRowProps> = ({
  label, contractAmount, totalWithVat, invoiced, paid, receivable, bold, className,
}) => (
  <tr className={cn('border-t-2 border-neutral-200 dark:border-neutral-600', className)}>
    <td className={cn('px-4 py-2.5 text-sm pl-4', bold && 'font-semibold')}>{label}</td>
    <td />
    <td />
    <AmountCell value={contractAmount} bold={bold} />
    <AmountCell value={totalWithVat} bold={bold} />
    <AmountCell value={invoiced} bold={bold} />
    <AmountCell value={paid} bold={bold} />
    <AmountCell value={receivable} bold={bold} danger={receivable > 0} />
  </tr>
);
