import React, { useMemo } from 'react';
import { cn } from '@/lib/cn';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  className?: string;
}

/**
 * Pure SVG sparkline component inspired by Stripe Dashboard KPI cards.
 * Draws a smooth polyline with an optional gradient fill below.
 */
export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 80,
  height = 24,
  color = 'var(--color-primary-500, #6366f1)',
  fillOpacity = 0.1,
  className,
}) => {
  const gradientId = useMemo(
    () => `sparkline-grad-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const pathData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Single point: render a dot instead
    if (data.length === 1) {
      return { type: 'dot' as const, cx: width / 2, cy: height / 2 };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    // Padding so the line doesn't touch the very edge
    const paddingY = 2;
    const usableHeight = height - paddingY * 2;

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      // If all values are the same, center the line vertically
      const y =
        range === 0
          ? height / 2
          : paddingY + usableHeight - ((val - min) / range) * usableHeight;
      return { x, y };
    });

    // Build a smooth SVG path using Catmull-Rom to cubic bezier conversion
    const linePath = buildSmoothPath(points);

    // Fill area: close the path along the bottom
    const fillPath = `${linePath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

    return { type: 'line' as const, linePath, fillPath };
  }, [data, width, height]);

  if (!pathData) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn('flex-shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {pathData.type === 'dot' ? (
        <circle cx={pathData.cx} cy={pathData.cy} r={2} fill={color} />
      ) : (
        <>
          {/* Gradient fill area */}
          <path d={pathData.fillPath} fill={`url(#${gradientId})`} />
          {/* Line */}
          <path
            d={pathData.linePath}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
};

/** Build a smooth SVG path through the given points using monotone cubic interpolation. */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Catmull-Rom to cubic bezier control points (tension = 0 for smooth curves)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return d;
}
