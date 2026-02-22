import React from 'react';

interface CvrBarProps {
  planned: number;
  contracted: number;
  actSigned: number;
  paid: number;
}

export default function CvrBar({ planned, contracted, actSigned, paid }: CvrBarProps) {
  if (!planned || planned <= 0) return <span className="text-xs text-neutral-400">—</span>;

  const pctContracted = Math.min((contracted / planned) * 100, 100);
  const pctActSigned = Math.min((actSigned / planned) * 100, 100);
  const pctPaid = Math.min((paid / planned) * 100, 100);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-24 h-3 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
        {/* Contracted — blue */}
        {pctContracted > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-blue-400 dark:bg-blue-500"
            style={{ width: `${pctContracted}%` }}
          />
        )}
        {/* Act Signed — orange, overlaid */}
        {pctActSigned > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-orange-400 dark:bg-orange-500"
            style={{ width: `${pctActSigned}%` }}
          />
        )}
        {/* Paid — green, overlaid */}
        {pctPaid > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-green-500 dark:bg-green-400"
            style={{ width: `${pctPaid}%` }}
          />
        )}
      </div>
      <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
        {Math.round(pctPaid)}%
      </span>
    </div>
  );
}
