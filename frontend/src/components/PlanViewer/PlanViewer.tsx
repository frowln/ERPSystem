import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PinMarker, type PinStatus } from './PinMarker';

export interface PlanPin {
  id: string;
  x: number;
  y: number;
  status: PinStatus;
  label: string;
  number?: number;
}

export interface PlanViewerProps {
  /** URL of the floor plan image */
  planImageUrl: string;
  /** Pins to display on the plan */
  pins: PlanPin[];
  /** Called when a pin is clicked */
  onPinClick?: (pinId: string) => void;
  /** Called when an empty area of the plan is clicked (for placing new pins) */
  onPlanClick?: (coords: { x: number; y: number }) => void;
  /** Currently selected pin id */
  selectedPinId?: string;
  /** Read-only mode: no click handlers fire */
  readOnly?: boolean;
  /** Highlighted pin id (temporary emphasis) */
  highlightedPinId?: string;
  /** Extra class for outer container */
  className?: string;
  /** When true, shows crosshair cursor for pin placement */
  addMode?: boolean;
}

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.15;

export const PlanViewer: React.FC<PlanViewerProps> = ({
  planImageUrl,
  pins,
  onPinClick,
  onPlanClick,
  selectedPinId,
  readOnly = false,
  highlightedPinId,
  className,
  addMode = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const clampZoom = useCallback((z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)), []);

  // -- Zoom via mouse wheel --
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setZoom((prev) => clampZoom(prev + delta));
    },
    [clampZoom],
  );

  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z + ZOOM_STEP)), [clampZoom]);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - ZOOM_STEP)), [clampZoom]);
  const fitToScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // -- Pan --
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (addMode) return;
      if (e.button !== 0) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    },
    [addMode, pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // -- Touch zoom (pinch) --
  const lastTouchDist = useRef<number | null>(null);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (lastTouchDist.current != null) {
          const delta = (dist - lastTouchDist.current) * 0.005;
          setZoom((z) => clampZoom(z + delta));
        }
        lastTouchDist.current = dist;
      }
    },
    [clampZoom],
  );

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
  }, []);

  // -- Plan click (add mode) --
  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (!addMode || readOnly || !imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        onPlanClick?.({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
      }
    },
    [addMode, readOnly, onPlanClick],
  );

  // -- Keyboard zoom --
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === '0') fitToScreen();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomIn, zoomOut, fitToScreen]);

  return (
    <div className={cn('relative flex flex-col h-full w-full', className)}>
      {/* Zoom toolbar */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-md p-1">
        <ToolbarBtn icon={ZoomIn} onClick={zoomIn} title="Zoom in" />
        <ToolbarBtn icon={ZoomOut} onClick={zoomOut} title="Zoom out" />
        <div className="h-px bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
        <ToolbarBtn icon={Maximize2} onClick={fitToScreen} title="Fit to screen" />
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-3 left-3 z-20 px-2 py-1 text-xs font-mono bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
        {Math.round(zoom * 100)}%
      </div>

      {/* Main viewport */}
      <div
        ref={containerRef}
        className={cn(
          'flex-1 overflow-hidden relative bg-neutral-100 dark:bg-neutral-900',
          isDragging ? 'cursor-grabbing' : addMode ? 'cursor-crosshair' : 'cursor-grab',
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative origin-top-left transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Plan image */}
          <img
            ref={imageRef}
            src={planImageUrl}
            alt="Floor plan"
            className="max-w-none select-none pointer-events-auto"
            draggable={false}
            onClick={handleImageClick}
          />

          {/* Pins overlay */}
          {pins.map((pin) => (
            <PinMarker
              key={pin.id}
              id={pin.id}
              x={pin.x}
              y={pin.y}
              status={pin.status}
              label={pin.label}
              number={pin.number}
              selected={selectedPinId === pin.id}
              highlighted={highlightedPinId === pin.id}
              onClick={readOnly ? undefined : onPinClick}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Internal toolbar button ---

const ToolbarBtn: React.FC<{
  icon: React.ElementType;
  onClick: () => void;
  title: string;
}> = ({ icon: Icon, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
  >
    <Icon size={15} />
  </button>
);

export default PlanViewer;
