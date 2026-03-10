import React, { useMemo, useState } from 'react';
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { t } from '@/i18n';
import type { ConstructionPermit, PermitStatus } from '@/types';

const STATUS_BAR_COLORS: Record<string, string> = {
  APPROVED: '#22c55e',
  ISSUED: '#22c55e',
  IN_PROGRESS: '#3b82f6',
  UNDER_REVIEW: '#3b82f6',
  SUBMITTED: '#eab308',
  PENDING: '#eab308',
  REJECTED: '#ef4444',
  EXPIRED: '#ef4444',
  REVOKED: '#ef4444',
  DRAFT: '#9ca3af',
  NOT_STARTED: '#9ca3af',
};

function getBarColor(status: PermitStatus | string): string {
  return STATUS_BAR_COLORS[status] ?? '#9ca3af';
}

const ROW_HEIGHT = 36;
const HEADER_HEIGHT = 32;
const LEFT_COL_WIDTH = 180;
const MIN_CHART_WIDTH = 600;
const PADDING_DAYS = 14;

interface TooltipInfo {
  x: number;
  y: number;
  permit: ConstructionPermit;
}

const PermitTimelineChart: React.FC<{ permits: ConstructionPermit[] }> = ({ permits }) => {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);

  const { filteredPermits, timelineStart, timelineEnd, totalDays } = useMemo(() => {
    // Filter permits that have at least one date
    const fp = permits.filter(
      (p) => p.issueDate || p.expiryDate,
    );

    if (fp.length === 0) {
      return { filteredPermits: [], timelineStart: new Date(), timelineEnd: new Date(), totalDays: 0 };
    }

    const dates: Date[] = [];
    for (const p of fp) {
      if (p.issueDate) dates.push(parseISO(p.issueDate));
      if (p.expiryDate) dates.push(parseISO(p.expiryDate));
    }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const ts = addDays(startOfMonth(minDate), -PADDING_DAYS);
    const te = addDays(endOfMonth(maxDate), PADDING_DAYS);
    const td = Math.max(differenceInDays(te, ts), 1);

    return { filteredPermits: fp, timelineStart: ts, timelineEnd: te, totalDays: td };
  }, [permits]);

  const months = useMemo(() => {
    if (totalDays === 0) return [];
    return eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
  }, [timelineStart, timelineEnd, totalDays]);

  if (permits.length === 0 || filteredPermits.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('projects.permits.timeline.noPermits')}
        </p>
      </div>
    );
  }

  const chartWidth = Math.max(MIN_CHART_WIDTH, totalDays * 3);
  const svgHeight = HEADER_HEIGHT + filteredPermits.length * ROW_HEIGHT + 4;

  const dayToX = (date: Date): number => {
    const days = differenceInDays(date, timelineStart);
    return (days / totalDays) * chartWidth;
  };

  const today = new Date();
  const todayX = dayToX(today);
  const showTodayLine = today >= timelineStart && today <= timelineEnd;

  const handleMouseEnter = (e: React.MouseEvent<SVGRectElement>, permit: ConstructionPermit) => {
    const rect = (e.target as SVGRectElement).getBoundingClientRect();
    const container = (e.target as SVGRectElement).closest('.permit-timeline-scroll');
    const containerRect = container?.getBoundingClientRect() ?? rect;
    setTooltip({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 8,
      permit,
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="relative">
      <div className="flex">
        {/* Left column: permit names */}
        <div className="flex-shrink-0" style={{ width: LEFT_COL_WIDTH }}>
          <div style={{ height: HEADER_HEIGHT }} className="border-b border-neutral-200 dark:border-neutral-700" />
          {filteredPermits.map((permit) => (
            <div
              key={permit.id}
              className="flex items-center px-2 border-b border-neutral-100 dark:border-neutral-800"
              style={{ height: ROW_HEIGHT }}
              title={t(`projects.permits.types.${permit.permitType}`)}
            >
              <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate block w-full">
                {t(`projects.permits.types.${permit.permitType}`)}
                {permit.number ? ` #${permit.number}` : ''}
              </span>
            </div>
          ))}
        </div>

        {/* Right: scrollable chart area */}
        <div className="flex-1 overflow-x-auto permit-timeline-scroll relative">
          <svg
            width={chartWidth}
            height={svgHeight}
            className="block"
          >
            {/* Month headers and grid lines */}
            {months.map((month) => {
              const x = dayToX(month);
              const label = format(month, 'LLL yyyy', { locale: ru });
              return (
                <g key={month.toISOString()}>
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={svgHeight}
                    className="stroke-neutral-200 dark:stroke-neutral-700"
                    strokeWidth={1}
                  />
                  <text
                    x={x + 4}
                    y={HEADER_HEIGHT - 10}
                    className="fill-neutral-500 dark:fill-neutral-400"
                    fontSize={11}
                    fontFamily="inherit"
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Header bottom line */}
            <line
              x1={0}
              y1={HEADER_HEIGHT}
              x2={chartWidth}
              y2={HEADER_HEIGHT}
              className="stroke-neutral-200 dark:stroke-neutral-700"
              strokeWidth={1}
            />

            {/* Permit bars */}
            {filteredPermits.map((permit, index) => {
              const startDate = permit.issueDate
                ? parseISO(permit.issueDate)
                : permit.expiryDate
                  ? parseISO(permit.expiryDate)
                  : today;

              const endDate = permit.expiryDate
                ? parseISO(permit.expiryDate)
                : addDays(startDate, 30); // default 30 days if no end

              const barX = dayToX(startDate);
              const barEndX = dayToX(endDate);
              const barWidth = Math.max(barEndX - barX, 4); // minimum visible width
              const barY = HEADER_HEIGHT + index * ROW_HEIGHT + (ROW_HEIGHT - 18) / 2;
              const color = getBarColor(permit.status);

              return (
                <g key={permit.id}>
                  {/* Row separator */}
                  <line
                    x1={0}
                    y1={HEADER_HEIGHT + (index + 1) * ROW_HEIGHT}
                    x2={chartWidth}
                    y2={HEADER_HEIGHT + (index + 1) * ROW_HEIGHT}
                    className="stroke-neutral-100 dark:stroke-neutral-800"
                    strokeWidth={1}
                  />
                  {/* Bar */}
                  <rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={18}
                    rx={4}
                    ry={4}
                    fill={color}
                    opacity={0.85}
                    className="cursor-pointer transition-opacity hover:opacity-100"
                    onMouseEnter={(e) => handleMouseEnter(e, permit)}
                    onMouseLeave={handleMouseLeave}
                  />
                </g>
              );
            })}

            {/* Today line */}
            {showTodayLine && (
              <g>
                <line
                  x1={todayX}
                  y1={0}
                  x2={todayX}
                  y2={svgHeight}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
                <text
                  x={todayX + 4}
                  y={HEADER_HEIGHT - 10}
                  fill="#ef4444"
                  fontSize={10}
                  fontWeight="bold"
                  fontFamily="inherit"
                >
                  {t('projects.permits.timeline.today')}
                </text>
              </g>
            )}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="absolute z-50 pointer-events-none bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg px-3 py-2 text-xs max-w-[260px]"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <p className="font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
                {t(`projects.permits.types.${tooltip.permit.permitType}`)}
                {tooltip.permit.number ? ` #${tooltip.permit.number}` : ''}
              </p>
              <p className="text-neutral-500 dark:text-neutral-400">
                {t('common.status')}: {t(`projects.permits.statuses.${tooltip.permit.status}`)}
              </p>
              {tooltip.permit.issueDate && (
                <p className="text-neutral-500 dark:text-neutral-400">
                  {t('projects.permits.timeline.submitDate')}: {format(parseISO(tooltip.permit.issueDate), 'd MMM yyyy', { locale: ru })}
                </p>
              )}
              {tooltip.permit.expiryDate && (
                <p className="text-neutral-500 dark:text-neutral-400">
                  {t('projects.permits.timeline.expiryDate')}: {format(parseISO(tooltip.permit.expiryDate), 'd MMM yyyy', { locale: ru })}
                </p>
              )}
              {tooltip.permit.issuingAuthority && (
                <p className="text-neutral-500 dark:text-neutral-400">
                  {t('projects.permits.timeline.authority')}: {tooltip.permit.issuingAuthority}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermitTimelineChart;
