import React, { useMemo } from 'react';
import { t } from '@/i18n';
import type { BudgetItem } from '@/types';

interface CvrViewProps {
  items: BudgetItem[];
}

const fmtAmt = (v: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(v);

export default function CvrView({ items }: CvrViewProps) {
  const rows = useMemo(
    () => items.filter((i) => !i.section && (i.plannedAmount ?? 0) > 0),
    [items],
  );

  const totals = useMemo(() => {
    let planned = 0, contracted = 0, actSigned = 0, paid = 0;
    for (const item of rows) {
      planned += item.plannedAmount ?? 0;
      contracted += item.contractedAmount ?? 0;
      actSigned += item.actSignedAmount ?? 0;
      paid += item.paidAmount ?? 0;
    }
    return { planned, contracted, actSigned, paid };
  }, [rows]);

  const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

  const thCls = 'px-3 py-2 text-xs font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 whitespace-nowrap';
  const tdCls = 'px-3 py-2 text-sm border-b border-neutral-100 dark:border-neutral-800';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
          {t('finance.fm.cvrTitle')}
        </h3>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={`${thCls} text-left w-[280px]`}>{t('finance.fm.colName')}</th>
              <th className={`${thCls} text-right`}>{t('finance.fm.cvrPlanned')}</th>
              <th className={`${thCls} text-right`}>{t('finance.fm.cvrContracted')}</th>
              <th className={`${thCls} text-right`}>{t('finance.fm.cvrActSigned')}</th>
              <th className={`${thCls} text-right`}>{t('finance.fm.cvrPaid')}</th>
              <th className={`${thCls} text-right w-[80px]`}>{t('finance.fm.cvrExecution')}</th>
              <th className={`${thCls} w-[180px]`}>{t('finance.fm.cvrProgress')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const planned = item.plannedAmount ?? 0;
              const contracted = item.contractedAmount ?? 0;
              const actSig = item.actSignedAmount ?? 0;
              const paid = item.paidAmount ?? 0;
              const execPct = pct(paid, planned);

              return (
                <tr key={item.id} className="hover:bg-blue-50/40 dark:hover:bg-neutral-800/30">
                  <td className={`${tdCls} text-neutral-800 dark:text-neutral-200 truncate max-w-[280px]`}>{item.name}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(planned)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(contracted)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(actSig)}</td>
                  <td className={`${tdCls} text-right tabular-nums`}>{fmtAmt(paid)}</td>
                  <td className={`${tdCls} text-right tabular-nums font-medium`}>{execPct.toFixed(1)}%</td>
                  <td className={tdCls}>
                    <CvrProgressBar planned={planned} contracted={contracted} actSigned={actSig} paid={paid} />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-neutral-100 dark:bg-neutral-800 font-semibold">
            <tr>
              <td className={`${tdCls} text-neutral-900 dark:text-neutral-100`}>{t('finance.fm.totalFooter')}</td>
              <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>{fmtAmt(totals.planned)}</td>
              <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>{fmtAmt(totals.contracted)}</td>
              <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>{fmtAmt(totals.actSigned)}</td>
              <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>{fmtAmt(totals.paid)}</td>
              <td className={`${tdCls} text-right tabular-nums text-neutral-900 dark:text-neutral-100`}>
                {pct(totals.paid, totals.planned).toFixed(1)}%
              </td>
              <td className={tdCls}>
                <CvrProgressBar planned={totals.planned} contracted={totals.contracted} actSigned={totals.actSigned} paid={totals.paid} />
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function CvrProgressBar({ planned, contracted, actSigned, paid }: { planned: number; contracted: number; actSigned: number; paid: number }) {
  if (planned <= 0) return <span className="text-xs text-neutral-400">—</span>;
  const pctContracted = Math.min((contracted / planned) * 100, 100);
  const pctAct = Math.min((actSigned / planned) * 100, 100);
  const pctPaid = Math.min((paid / planned) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 h-4 rounded bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
        {pctContracted > 0 && (
          <div className="absolute inset-y-0 left-0 bg-blue-400 dark:bg-blue-500" style={{ width: `${pctContracted}%` }} />
        )}
        {pctAct > 0 && (
          <div className="absolute inset-y-0 left-0 bg-orange-400 dark:bg-orange-500" style={{ width: `${pctAct}%` }} />
        )}
        {pctPaid > 0 && (
          <div className="absolute inset-y-0 left-0 bg-green-500 dark:bg-green-400" style={{ width: `${pctPaid}%` }} />
        )}
      </div>
      <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums w-10 text-right">
        {Math.round(pctPaid)}%
      </span>
    </div>
  );
}
