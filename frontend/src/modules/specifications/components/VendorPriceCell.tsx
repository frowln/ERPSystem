import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import type { CellData } from '../lib/matrixBuilder';
import type { VendorColor } from '../lib/vendorColors';

interface VendorPriceCellProps {
  cell: CellData | undefined;
  vendorColor: VendorColor;
  itemQuantity: number;
  onSelect: () => void;
  onReject: (type: string) => void;
  onUnreject: () => void;
  onAddProposal: () => void;
  onDelete: () => void;
  disabled: boolean;
}

export const VendorPriceCell: React.FC<VendorPriceCellProps> = ({
  cell,
  vendorColor,
  itemQuantity,
  onSelect,
  onReject,
  onUnreject,
  onAddProposal,
  onDelete,
  disabled,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen, handleClickOutside]);

  // Empty cell
  if (!cell) {
    return (
      <td className="px-2 py-1.5 text-center text-neutral-400 dark:text-neutral-500 border-r border-neutral-200 dark:border-neutral-700 group/empty">
        <span className="text-sm">—</span>
        {!disabled && (
          <button
            onClick={onAddProposal}
            className="hidden group-hover/empty:inline-flex ml-1 p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
            title={t('competitiveList.detail.addProposal')}
          >
            <Plus size={12} />
          </button>
        )}
      </td>
    );
  }

  const { entry, isBestPrice, isWinner, isRejected, rejectionType } = cell;
  const totalPrice = entry.unitPrice * (entry.quantity ?? itemQuantity);

  return (
    <td
      className={cn(
        'px-2 py-1.5 text-right border-r border-neutral-200 dark:border-neutral-700 relative group/cell cursor-pointer',
        isWinner && `border-l-[3px] ${vendorColor.border}`,
        isWinner && `${vendorColor.lightBg} ${vendorColor.darkBg}`,
        isRejected && 'opacity-50',
        !isWinner && !isRejected && 'hover:bg-neutral-50 dark:hover:bg-neutral-800',
      )}
      onClick={() => !disabled && !isRejected && onSelect()}
    >
      <div className="flex flex-col items-end gap-0.5">
        <div className="flex items-center gap-1">
          {isWinner && <Check size={12} className="text-green-600 dark:text-green-400 flex-shrink-0" />}
          <span
            className={cn(
              'text-sm font-medium tabular-nums',
              isRejected && 'line-through',
              isBestPrice && !isRejected && 'text-green-600 dark:text-green-400 font-bold',
            )}
          >
            {formatMoney(entry.unitPrice).replace(' ₽', '')}
          </span>
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
          {formatMoney(totalPrice).replace(' ₽', '')} {t('competitiveList.matrix.total')}
        </span>
        {(entry.deliveryDays || entry.warrantyMonths) && (
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            {entry.deliveryDays ? `${entry.deliveryDays} ${t('competitiveList.matrix.days')}` : ''}
            {entry.deliveryDays && entry.warrantyMonths ? ' · ' : ''}
            {entry.warrantyMonths ? `${entry.warrantyMonths} ${t('competitiveList.matrix.months')}` : ''}
          </span>
        )}
        {isRejected && rejectionType && (
          <span className="text-[10px] px-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            {rejectionType === 'PRICE' ? t('competitiveList.matrix.rejectedPrice') :
             rejectionType === 'TECHNICAL' ? t('competitiveList.matrix.rejectedTechnical') :
             rejectionType === 'DELIVERY' ? t('competitiveList.matrix.rejectedDelivery') :
             t('competitiveList.matrix.rejectedOther')}
          </span>
        )}
      </div>

      {/* Context menu button */}
      {!disabled && (
        <div className="absolute top-0.5 right-0.5 hidden group-hover/cell:block" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600"
          >
            <MoreHorizontal size={12} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-5 z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-md shadow-lg py-1 min-w-[160px]">
              {!isWinner && !isRejected && (
                <MenuItem onClick={() => { onSelect(); setMenuOpen(false); }}>
                  {t('competitiveList.matrix.selectWinner')}
                </MenuItem>
              )}
              {!isRejected && (
                <>
                  <MenuItem onClick={() => { onReject('PRICE'); setMenuOpen(false); }}>
                    {t('competitiveList.matrix.rejectPrice')}
                  </MenuItem>
                  <MenuItem onClick={() => { onReject('TECHNICAL'); setMenuOpen(false); }}>
                    {t('competitiveList.matrix.rejectTechnical')}
                  </MenuItem>
                  <MenuItem onClick={() => { onReject('DELIVERY'); setMenuOpen(false); }}>
                    {t('competitiveList.matrix.rejectDelivery')}
                  </MenuItem>
                </>
              )}
              {isRejected && (
                <MenuItem onClick={() => { onUnreject(); setMenuOpen(false); }}>
                  {t('competitiveList.matrix.unreject')}
                </MenuItem>
              )}
              <div className="border-t border-neutral-200 dark:border-neutral-600 my-1" />
              <MenuItem onClick={() => { onDelete(); setMenuOpen(false); }} danger>
                {t('common.delete')}
              </MenuItem>
            </div>
          )}
        </div>
      )}
    </td>
  );
};

const MenuItem: React.FC<{ onClick: () => void; children: React.ReactNode; danger?: boolean }> = ({
  onClick, children, danger,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full text-left px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700',
      danger ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300',
    )}
  >
    {children}
  </button>
);
