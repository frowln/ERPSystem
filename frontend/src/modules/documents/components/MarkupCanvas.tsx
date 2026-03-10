import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DrawingMarkup } from '@/api/markups';
import type { MarkupTool } from './MarkupToolbar';

interface MarkupCanvasProps {
  markups: DrawingMarkup[];
  activeTool: MarkupTool;
  activeColor: string;
  activeStrokeWidth: number;
  selectedMarkupId: string | null;
  onSelectMarkup: (id: string | null) => void;
  onCreateMarkup: (markup: Partial<DrawingMarkup>) => void;
  zoom: number;
}

interface DrawState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDrawing: boolean;
  freehandPoints: { x: number; y: number }[];
}

const INITIAL_DRAW_STATE: DrawState = {
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  isDrawing: false,
  freehandPoints: [],
};

function getCloudPath(x: number, y: number, w: number, h: number): string {
  const bumps = 6;
  const path: string[] = [];
  const rx = w / bumps;
  const ry = h / bumps;

  // Top edge
  path.push(`M ${x} ${y + h / 2}`);
  for (let i = 0; i < bumps; i++) {
    const cx = x + (i + 0.5) * (w / bumps);
    const cy = y - ry * 0.5;
    const ex = x + (i + 1) * (w / bumps);
    const ey = y;
    path.push(`Q ${cx} ${cy} ${ex} ${ey}`);
  }
  // Right edge
  for (let i = 0; i < bumps; i++) {
    const cx = x + w + rx * 0.5;
    const cy = y + (i + 0.5) * (h / bumps);
    const ex = x + w;
    const ey = y + (i + 1) * (h / bumps);
    path.push(`Q ${cx} ${cy} ${ex} ${ey}`);
  }
  // Bottom edge
  for (let i = bumps; i > 0; i--) {
    const cx = x + (i - 0.5) * (w / bumps);
    const cy = y + h + ry * 0.5;
    const ex = x + (i - 1) * (w / bumps);
    const ey = y + h;
    path.push(`Q ${cx} ${cy} ${ex} ${ey}`);
  }
  // Left edge
  for (let i = bumps; i > 0; i--) {
    const cx = x - rx * 0.5;
    const cy = y + (i - 0.5) * (h / bumps);
    const ex = x;
    const ey = y + (i - 1) * (h / bumps);
    path.push(`Q ${cx} ${cy} ${ex} ${ey}`);
  }
  path.push('Z');
  return path.join(' ');
}

function renderMarkup(
  markup: DrawingMarkup,
  isSelected: boolean,
  onSelect: (id: string) => void,
) {
  const { id, markupType, x, y, width, height, color, strokeWidth, textContent } = markup;
  const w = width ?? 0;
  const h = height ?? 0;
  const commonProps = {
    'data-markup-id': id,
    cursor: 'pointer',
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(id);
    },
  };

  const selectedStroke = isSelected ? '#2563EB' : undefined;

  switch (markupType) {
    case 'RECTANGLE':
      return (
        <g key={id} {...commonProps}>
          <rect
            x={x}
            y={y}
            width={Math.abs(w)}
            height={Math.abs(h)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <rect
              x={x - 2}
              y={y - 2}
              width={Math.abs(w) + 4}
              height={Math.abs(h) + 4}
              fill="none"
              stroke={selectedStroke}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )}
        </g>
      );

    case 'CIRCLE':
      return (
        <g key={id} {...commonProps}>
          <ellipse
            cx={x + w / 2}
            cy={y + h / 2}
            rx={Math.abs(w / 2)}
            ry={Math.abs(h / 2)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <rect
              x={x - 2}
              y={y - 2}
              width={Math.abs(w) + 4}
              height={Math.abs(h) + 4}
              fill="none"
              stroke={selectedStroke}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )}
        </g>
      );

    case 'ARROW':
      return (
        <g key={id} {...commonProps}>
          <defs>
            <marker
              id={`arrow-${id}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          </defs>
          <line
            x1={x}
            y1={y}
            x2={x + w}
            y2={y + h}
            stroke={color}
            strokeWidth={strokeWidth}
            markerEnd={`url(#arrow-${id})`}
          />
          {isSelected && (
            <>
              <circle cx={x} cy={y} r={4} fill={selectedStroke} />
              <circle cx={x + w} cy={y + h} r={4} fill={selectedStroke} />
            </>
          )}
        </g>
      );

    case 'TEXT':
      return (
        <g key={id} {...commonProps}>
          <foreignObject x={x} y={y} width={Math.max(w, 120)} height={Math.max(h, 30)}>
            <div
              style={{
                color,
                fontSize: 14,
                fontFamily: 'sans-serif',
                whiteSpace: 'pre-wrap',
                padding: 2,
              }}
            >
              {textContent || ''}
            </div>
          </foreignObject>
          {isSelected && (
            <rect
              x={x - 2}
              y={y - 2}
              width={Math.max(w, 120) + 4}
              height={Math.max(h, 30) + 4}
              fill="none"
              stroke={selectedStroke}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )}
        </g>
      );

    case 'CLOUD':
      return (
        <g key={id} {...commonProps}>
          <path
            d={getCloudPath(x, y, Math.abs(w), Math.abs(h))}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          {isSelected && (
            <rect
              x={x - 2}
              y={y - 2}
              width={Math.abs(w) + 4}
              height={Math.abs(h) + 4}
              fill="none"
              stroke={selectedStroke}
              strokeWidth={1}
              strokeDasharray="4 2"
            />
          )}
        </g>
      );

    case 'FREEHAND': {
      // textContent stores serialized points
      let points: { x: number; y: number }[] = [];
      if (textContent) {
        try {
          points = JSON.parse(textContent) as { x: number; y: number }[];
        } catch {
          // ignore
        }
      }
      if (points.length < 2) return null;
      const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      return (
        <g key={id} {...commonProps}>
          <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          {isSelected && (
            <path d={d} fill="none" stroke={selectedStroke} strokeWidth={1} strokeDasharray="4 2" />
          )}
        </g>
      );
    }

    default:
      return null;
  }
}

const MarkupCanvas: React.FC<MarkupCanvasProps> = ({
  markups,
  activeTool,
  activeColor,
  activeStrokeWidth,
  selectedMarkupId,
  onSelectMarkup,
  onCreateMarkup,
  zoom,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawState, setDrawState] = useState<DrawState>(INITIAL_DRAW_STATE);

  const getMousePos = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      };
    },
    [zoom],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (activeTool === 'SELECT') return;
      const pos = getMousePos(e);
      setDrawState({
        startX: pos.x,
        startY: pos.y,
        currentX: pos.x,
        currentY: pos.y,
        isDrawing: true,
        freehandPoints: [pos],
      });
    },
    [activeTool, getMousePos],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!drawState.isDrawing) return;
      const pos = getMousePos(e);
      setDrawState((prev) => ({
        ...prev,
        currentX: pos.x,
        currentY: pos.y,
        freehandPoints:
          activeTool === 'FREEHAND' ? [...prev.freehandPoints, pos] : prev.freehandPoints,
      }));
    },
    [drawState.isDrawing, getMousePos, activeTool],
  );

  const handleMouseUp = useCallback(() => {
    if (!drawState.isDrawing) return;
    const { startX, startY, currentX, currentY, freehandPoints } = drawState;
    setDrawState(INITIAL_DRAW_STATE);

    const w = currentX - startX;
    const h = currentY - startY;

    // Minimum size threshold
    if (activeTool !== 'FREEHAND' && activeTool !== 'TEXT' && Math.abs(w) < 5 && Math.abs(h) < 5) return;

    const base: Partial<DrawingMarkup> = {
      markupType: activeTool as DrawingMarkup['markupType'],
      color: activeColor,
      strokeWidth: activeStrokeWidth,
      status: 'ACTIVE',
    };

    switch (activeTool) {
      case 'RECTANGLE':
      case 'CIRCLE':
      case 'CLOUD':
        onCreateMarkup({
          ...base,
          x: Math.min(startX, currentX),
          y: Math.min(startY, currentY),
          width: Math.abs(w),
          height: Math.abs(h),
        });
        break;
      case 'ARROW':
        onCreateMarkup({
          ...base,
          x: startX,
          y: startY,
          width: w,
          height: h,
        });
        break;
      case 'TEXT':
        onCreateMarkup({
          ...base,
          x: startX,
          y: startY,
          width: Math.max(Math.abs(w), 120),
          height: Math.max(Math.abs(h), 30),
          textContent: '',
        });
        break;
      case 'FREEHAND':
        if (freehandPoints.length < 2) break;
        onCreateMarkup({
          ...base,
          x: startX,
          y: startY,
          width: 0,
          height: 0,
          textContent: JSON.stringify(freehandPoints),
        });
        break;
    }
  }, [drawState, activeTool, activeColor, activeStrokeWidth, onCreateMarkup]);

  // Keyboard handler for escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSelectMarkup(null);
        setDrawState(INITIAL_DRAW_STATE);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSelectMarkup]);

  // Render preview shape while drawing
  const renderPreview = () => {
    if (!drawState.isDrawing) return null;
    const { startX, startY, currentX, currentY, freehandPoints } = drawState;
    const w = currentX - startX;
    const h = currentY - startY;

    switch (activeTool) {
      case 'RECTANGLE':
        return (
          <rect
            x={Math.min(startX, currentX)}
            y={Math.min(startY, currentY)}
            width={Math.abs(w)}
            height={Math.abs(h)}
            fill="none"
            stroke={activeColor}
            strokeWidth={activeStrokeWidth}
            opacity={0.6}
            strokeDasharray="4 2"
          />
        );
      case 'CIRCLE':
        return (
          <ellipse
            cx={(startX + currentX) / 2}
            cy={(startY + currentY) / 2}
            rx={Math.abs(w / 2)}
            ry={Math.abs(h / 2)}
            fill="none"
            stroke={activeColor}
            strokeWidth={activeStrokeWidth}
            opacity={0.6}
            strokeDasharray="4 2"
          />
        );
      case 'ARROW':
        return (
          <line
            x1={startX}
            y1={startY}
            x2={currentX}
            y2={currentY}
            stroke={activeColor}
            strokeWidth={activeStrokeWidth}
            opacity={0.6}
            strokeDasharray="4 2"
          />
        );
      case 'CLOUD':
        return (
          <rect
            x={Math.min(startX, currentX)}
            y={Math.min(startY, currentY)}
            width={Math.abs(w)}
            height={Math.abs(h)}
            fill="none"
            stroke={activeColor}
            strokeWidth={activeStrokeWidth}
            opacity={0.4}
            strokeDasharray="6 3"
          />
        );
      case 'TEXT':
        return (
          <rect
            x={startX}
            y={startY}
            width={Math.max(Math.abs(w), 120)}
            height={Math.max(Math.abs(h), 30)}
            fill="none"
            stroke={activeColor}
            strokeWidth={1}
            opacity={0.4}
            strokeDasharray="4 2"
          />
        );
      case 'FREEHAND': {
        if (freehandPoints.length < 2) return null;
        const d = freehandPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return (
          <path
            d={d}
            fill="none"
            stroke={activeColor}
            strokeWidth={activeStrokeWidth}
            opacity={0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      }
      default:
        return null;
    }
  };

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if ((e.target as Element).tagName === 'svg') {
        onSelectMarkup(null);
      }
    },
    [onSelectMarkup],
  );

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0"
      width="100%"
      height="100%"
      style={{ cursor: activeTool === 'SELECT' ? 'default' : 'crosshair' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {markups.map((markup) =>
        renderMarkup(markup, markup.id === selectedMarkupId, (id) => onSelectMarkup(id)),
      )}
      {renderPreview()}
    </svg>
  );
};

export default MarkupCanvas;
