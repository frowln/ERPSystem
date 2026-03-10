import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Download,
  Layers,
  SplitSquareHorizontal,
  GripVertical,
  Palette,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { PageHeader } from '@/design-system/components/PageHeader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DrawingRevision {
  id: string;
  drawingId: string;
  revisionNumber: string;
  label: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface DiffBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CompareMode = 'overlay' | 'side-by-side' | 'swipe';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_DRAWINGS = [
  { id: 'drw-1', name: 'Floor Plan Level 1 - AR-101' },
  { id: 'drw-2', name: 'Floor Plan Level 2 - AR-102' },
  { id: 'drw-3', name: 'Structural Plan - KR-201' },
];

const MOCK_REVISIONS: Record<string, DrawingRevision[]> = {
  'drw-1': [
    { id: 'rev-1a', drawingId: 'drw-1', revisionNumber: 'Rev.A', label: 'Rev.A - Initial Issue', uploadedAt: '2025-12-01', uploadedBy: 'Иванов А.С.' },
    { id: 'rev-1b', drawingId: 'drw-1', revisionNumber: 'Rev.B', label: 'Rev.B - Updated Layout', uploadedAt: '2026-01-15', uploadedBy: 'Петров В.И.' },
    { id: 'rev-1c', drawingId: 'drw-1', revisionNumber: 'Rev.C', label: 'Rev.C - Final Coordination', uploadedAt: '2026-02-20', uploadedBy: 'Сидоров К.Н.' },
  ],
  'drw-2': [
    { id: 'rev-2a', drawingId: 'drw-2', revisionNumber: 'Rev.A', label: 'Rev.A - Initial Issue', uploadedAt: '2025-12-05', uploadedBy: 'Иванов А.С.' },
    { id: 'rev-2b', drawingId: 'drw-2', revisionNumber: 'Rev.B', label: 'Rev.B - Client Comments', uploadedAt: '2026-01-20', uploadedBy: 'Козлов Д.М.' },
  ],
  'drw-3': [
    { id: 'rev-3a', drawingId: 'drw-3', revisionNumber: 'Rev.0', label: 'Rev.0 - For Review', uploadedAt: '2025-11-20', uploadedBy: 'Петров В.И.' },
    { id: 'rev-3b', drawingId: 'drw-3', revisionNumber: 'Rev.1', label: 'Rev.1 - For Construction', uploadedAt: '2026-01-10', uploadedBy: 'Сидоров К.Н.' },
    { id: 'rev-3c', drawingId: 'drw-3', revisionNumber: 'Rev.2', label: 'Rev.2 - As-built', uploadedAt: '2026-03-01', uploadedBy: 'Иванов А.С.' },
  ],
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.15;
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 900;

// ---------------------------------------------------------------------------
// Mock drawing renderer — draws colored rectangles to simulate revision diffs
// ---------------------------------------------------------------------------

function drawMockPlan(
  ctx: CanvasRenderingContext2D,
  _revisionId: string,
  width: number,
  height: number,
  seed: number,
) {
  // Background — simulated "paper"
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, width, height);

  // Title block
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, width - 40, height - 40);
  ctx.strokeRect(width - 320, height - 80, 300, 60);

  // Grid lines
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 0.5;
  for (let x = 60; x < width - 40; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, height - 20);
    ctx.stroke();
  }
  for (let y = 60; y < height - 40; y += 80) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();
  }

  // Deterministic "random" shapes based on seed
  const rng = (n: number) => ((seed * 9301 + 49297 + n * 1327) % 233280) / 233280;

  // Common elements (same in all revisions)
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.5;
  // Walls
  ctx.strokeRect(100, 100, 400, 300);
  ctx.strokeRect(100, 100, 200, 150);
  ctx.strokeRect(550, 100, 350, 300);
  ctx.strokeRect(100, 450, 600, 250);
  // Staircase
  ctx.strokeRect(520, 420, 80, 100);
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(520, 420 + i * 12.5);
    ctx.lineTo(600, 420 + i * 12.5);
    ctx.stroke();
  }

  // Revision-specific elements (this is what changes between revisions)
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;

  // Rooms that shift between revisions
  const offsetX = Math.floor(rng(1) * 60) - 30;
  const offsetY = Math.floor(rng(2) * 40) - 20;

  // Room partition (moves between revisions)
  ctx.beginPath();
  ctx.moveTo(300 + offsetX, 100);
  ctx.lineTo(300 + offsetX, 250 + offsetY);
  ctx.stroke();

  // Door opening
  const doorPos = 150 + Math.floor(rng(3) * 80);
  ctx.clearRect(doorPos, 398, 40, 6);
  ctx.beginPath();
  ctx.arc(doorPos, 400, 40, -Math.PI / 2, 0);
  ctx.stroke();

  // Equipment blocks (change position per revision)
  ctx.fillStyle = '#ccc';
  ctx.fillRect(120 + offsetX, 130 + offsetY, 50, 30);
  ctx.fillRect(580, 150 + offsetY, 60, 40);
  ctx.fillRect(650 + offsetX, 470, 40, 60);

  // Annotation circles
  ctx.beginPath();
  ctx.arc(750 + offsetX, 220, 25, 0, Math.PI * 2);
  ctx.stroke();

  // Dimension lines
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 0.7;
  const dimY = 80 + Math.floor(rng(4) * 10);
  ctx.beginPath();
  ctx.moveTo(100, dimY);
  ctx.lineTo(500, dimY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(100, dimY - 5);
  ctx.lineTo(100, dimY + 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(500, dimY - 5);
  ctx.lineTo(500, dimY + 5);
  ctx.stroke();
}

function generateDiffBoxes(seed1: number, seed2: number): DiffBoundingBox[] {
  if (seed1 === seed2) return [];
  const boxes: DiffBoundingBox[] = [];
  const rng = (n: number) => ((Math.abs(seed1 - seed2) * 9301 + 49297 + n * 7919) % 233280) / 233280;
  const count = 2 + Math.floor(rng(0) * 4);
  for (let i = 0; i < count; i++) {
    boxes.push({
      x: 60 + rng(i * 4 + 1) * (CANVAS_WIDTH - 200),
      y: 60 + rng(i * 4 + 2) * (CANVAS_HEIGHT - 200),
      width: 60 + rng(i * 4 + 3) * 120,
      height: 40 + rng(i * 4 + 4) * 80,
    });
  }
  return boxes;
}

function getRevisionSeed(revisionId: string): number {
  let hash = 0;
  for (let i = 0; i < revisionId.length; i++) {
    hash = ((hash << 5) - hash) + revisionId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DrawingOverlayComparisonPage: React.FC = () => {
  // Drawing & revision selection
  const [selectedDrawingId, setSelectedDrawingId] = useState<string>('');
  const [baseRevisionId, setBaseRevisionId] = useState<string>('');
  const [compareRevisionId, setCompareRevisionId] = useState<string>('');

  // Display mode
  const [mode, setMode] = useState<CompareMode>('overlay');

  // Overlay settings
  const [opacityBase, setOpacityBase] = useState(70);
  const [opacityCompare, setOpacityCompare] = useState(70);
  const [showDiffBoxes, setShowDiffBoxes] = useState(true);

  // Pan & zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Swipe divider position (0-100%)
  const [swipePos, setSwipePos] = useState(50);
  const [isSwipeDragging, setIsSwipeDragging] = useState(false);

  // Canvas refs
  const containerRef = useRef<HTMLDivElement>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement>(null);
  const compareCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Derived data
  const revisions = selectedDrawingId ? MOCK_REVISIONS[selectedDrawingId] ?? [] : [];

  const diffBoxes = useMemo(() => {
    if (!baseRevisionId || !compareRevisionId || baseRevisionId === compareRevisionId) return [];
    return generateDiffBoxes(getRevisionSeed(baseRevisionId), getRevisionSeed(compareRevisionId));
  }, [baseRevisionId, compareRevisionId]);

  // -----------------------------------------------------------------------
  // Draw mock plans to canvases
  // -----------------------------------------------------------------------
  const renderCanvas = useCallback((canvas: HTMLCanvasElement | null, revisionId: string) => {
    if (!canvas || !revisionId) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawMockPlan(ctx, revisionId, CANVAS_WIDTH, CANVAS_HEIGHT, getRevisionSeed(revisionId));
  }, []);

  useEffect(() => {
    renderCanvas(baseCanvasRef.current, baseRevisionId);
  }, [baseRevisionId, renderCanvas]);

  useEffect(() => {
    renderCanvas(compareCanvasRef.current, compareRevisionId);
  }, [compareRevisionId, renderCanvas]);

  // Render overlay composite
  useEffect(() => {
    if (mode !== 'overlay') return;
    const canvas = overlayCanvasRef.current;
    if (!canvas || !baseRevisionId || !compareRevisionId) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // White bg
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw base in green tint
    if (baseCanvasRef.current) {
      ctx.save();
      ctx.globalAlpha = opacityBase / 100;
      ctx.globalCompositeOperation = 'multiply';
      // Green channel tint: draw base image, then overlay green
      ctx.drawImage(baseCanvasRef.current, 0, 0);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(34, 197, 94, ${opacityBase / 200})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }

    // Draw compare in red tint
    if (compareCanvasRef.current) {
      ctx.save();
      ctx.globalAlpha = opacityCompare / 100;
      ctx.globalCompositeOperation = 'multiply';
      ctx.drawImage(compareCanvasRef.current, 0, 0);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(239, 68, 68, ${opacityCompare / 200})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }

    // Difference highlight boxes
    if (showDiffBoxes && diffBoxes.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      diffBoxes.forEach((box) => {
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      });
      ctx.restore();
    }
  }, [mode, baseRevisionId, compareRevisionId, opacityBase, opacityCompare, showDiffBoxes, diffBoxes]);

  // -----------------------------------------------------------------------
  // Zoom
  // -----------------------------------------------------------------------
  const clampZoom = useCallback((z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)), []);

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
  const fitView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setOpacityBase(70);
    setOpacityCompare(70);
    setSwipePos(50);
  }, []);

  // -----------------------------------------------------------------------
  // Pan
  // -----------------------------------------------------------------------
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isSwipeDragging) return;
      if (e.button !== 0) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    },
    [pan, isSwipeDragging],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isSwipeDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        setSwipePos(Math.min(100, Math.max(0, pct)));
        return;
      }
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
    },
    [isDragging, isSwipeDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsSwipeDragging(false);
  }, []);

  // -----------------------------------------------------------------------
  // Export as PNG
  // -----------------------------------------------------------------------
  const exportPng = useCallback(() => {
    let sourceCanvas: HTMLCanvasElement | null = null;
    if (mode === 'overlay') {
      sourceCanvas = overlayCanvasRef.current;
    } else {
      sourceCanvas = baseCanvasRef.current;
    }
    if (!sourceCanvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_WIDTH;
    exportCanvas.height = CANVAS_HEIGHT;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    if (mode === 'overlay' && overlayCanvasRef.current) {
      ctx.drawImage(overlayCanvasRef.current, 0, 0);
    } else {
      // Side by side: export both side by side
      exportCanvas.width = CANVAS_WIDTH * 2 + 20;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      if (baseCanvasRef.current) ctx.drawImage(baseCanvasRef.current, 0, 0);
      if (compareCanvasRef.current) ctx.drawImage(compareCanvasRef.current, CANVAS_WIDTH + 20, 0);
    }

    const link = document.createElement('a');
    link.download = `overlay-comparison-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [mode]);

  // -----------------------------------------------------------------------
  // Auto-select first drawing and revisions
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (selectedDrawingId && revisions.length >= 2) {
      if (!baseRevisionId || !revisions.find((r) => r.id === baseRevisionId)) {
        setBaseRevisionId(revisions[0].id);
      }
      if (!compareRevisionId || !revisions.find((r) => r.id === compareRevisionId)) {
        setCompareRevisionId(revisions[revisions.length - 1].id);
      }
    }
  }, [selectedDrawingId, revisions, baseRevisionId, compareRevisionId]);

  // -----------------------------------------------------------------------
  // Has selections
  // -----------------------------------------------------------------------
  const hasSelection = !!baseRevisionId && !!compareRevisionId && baseRevisionId !== compareRevisionId;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-0">
      <PageHeader
        title={t('bim.overlay.title')}
        subtitle={t('bim.overlay.subtitle')}
        breadcrumbs={[
          { label: t('bim.breadcrumbHome'), href: '/' },
          { label: t('bim.breadcrumbBim'), href: '/bim/models' },
          { label: t('bim.overlay.breadcrumb') },
        ]}
        actions={
          <button
            onClick={exportPng}
            disabled={!hasSelection}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              hasSelection
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed',
            )}
          >
            <Download size={16} />
            {t('bim.overlay.btnExportPng')}
          </button>
        }
      />

      {/* Controls bar */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-4 mb-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Drawing selector */}
          <div className="min-w-[200px]">
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
              {t('bim.overlay.selectDrawing')}
            </label>
            <select
              value={selectedDrawingId}
              onChange={(e) => {
                setSelectedDrawingId(e.target.value);
                setBaseRevisionId('');
                setCompareRevisionId('');
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="">{t('bim.overlay.selectRevision')}</option>
              {MOCK_DRAWINGS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Base revision */}
          <div className="min-w-[200px]">
            <label className="block text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
              {t('bim.overlay.baseRevision')}
            </label>
            <select
              value={baseRevisionId}
              onChange={(e) => setBaseRevisionId(e.target.value)}
              disabled={!selectedDrawingId}
              className="w-full px-3 py-2 text-sm rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
            >
              <option value="">{t('bim.overlay.selectRevision')}</option>
              {revisions.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Compare revision */}
          <div className="min-w-[200px]">
            <label className="block text-xs font-medium text-red-600 dark:text-red-400 mb-1">
              {t('bim.overlay.compareRevision')}
            </label>
            <select
              value={compareRevisionId}
              onChange={(e) => setCompareRevisionId(e.target.value)}
              disabled={!selectedDrawingId}
              className="w-full px-3 py-2 text-sm rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
            >
              <option value="">{t('bim.overlay.selectRevision')}</option>
              {revisions.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Mode toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
            <ModeButton
              active={mode === 'overlay'}
              onClick={() => setMode('overlay')}
              icon={Layers}
              label={t('bim.overlay.modeOverlay')}
            />
            <ModeButton
              active={mode === 'side-by-side'}
              onClick={() => setMode('side-by-side')}
              icon={SplitSquareHorizontal}
              label={t('bim.overlay.modeSideBySide')}
            />
            <ModeButton
              active={mode === 'swipe'}
              onClick={() => setMode('swipe')}
              icon={GripVertical}
              label={t('bim.overlay.modeSwipe')}
            />
          </div>
        </div>

        {/* Opacity sliders (only in overlay mode) */}
        {mode === 'overlay' && hasSelection && (
          <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700">
            <div className="flex items-center gap-3 min-w-[220px]">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                {t('bim.overlay.opacityBase')}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={opacityBase}
                onChange={(e) => setOpacityBase(Number(e.target.value))}
                className="flex-1 h-1.5 accent-emerald-500"
              />
              <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400 w-8 text-right">{opacityBase}%</span>
            </div>

            <div className="flex items-center gap-3 min-w-[220px]">
              <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                {t('bim.overlay.opacityCompare')}
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={opacityCompare}
                onChange={(e) => setOpacityCompare(Number(e.target.value))}
                className="flex-1 h-1.5 accent-red-500"
              />
              <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400 w-8 text-right">{opacityCompare}%</span>
            </div>

            <button
              onClick={() => setShowDiffBoxes(!showDiffBoxes)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                showDiffBoxes
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                  : 'bg-neutral-50 dark:bg-neutral-700 border-neutral-200 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400',
              )}
            >
              <Square size={12} />
              {t('bim.overlay.differenceCount', { count: String(diffBoxes.length) })}
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                <Palette size={12} />
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> {t('bim.overlay.colorBase')}
                </span>
                <span className="flex items-center gap-1 ml-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> {t('bim.overlay.colorCompare')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Viewport toolbar */}
      {hasSelection && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex items-center gap-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-2 py-1.5 shadow-sm">
            <ToolbarButton icon={ZoomIn} onClick={zoomIn} title={t('bim.overlay.btnZoomIn')} />
            <ToolbarButton icon={ZoomOut} onClick={zoomOut} title={t('bim.overlay.btnZoomOut')} />
            <ToolbarButton icon={Maximize2} onClick={fitView} title={t('bim.overlay.btnFitView')} />
            <ToolbarButton icon={RotateCcw} onClick={resetView} title={t('bim.overlay.btnResetView')} />
            <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums min-w-[40px] text-center select-none">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {diffBoxes.length > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
              {t('bim.overlay.differenceCount', { count: String(diffBoxes.length) })}
            </span>
          )}
          {baseRevisionId && compareRevisionId && baseRevisionId === compareRevisionId && (
            <span className="text-xs text-neutral-400 ml-2">{t('bim.overlay.noDifferences')}</span>
          )}
        </div>
      )}

      {/* Main viewport */}
      <div
        ref={containerRef}
        className={cn(
          'relative w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 overflow-hidden select-none',
          hasSelection ? 'h-[calc(100vh-380px)] min-h-[400px]' : 'h-64',
          !hasSelection && 'flex items-center justify-center',
          hasSelection && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
        )}
        onWheel={hasSelection ? handleWheel : undefined}
        onMouseDown={hasSelection ? handleMouseDown : undefined}
        onMouseMove={hasSelection ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Empty state */}
        {!hasSelection && (
          <div className="text-center px-4">
            <Layers size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t('bim.overlay.emptyState')}
            </p>
          </div>
        )}

        {/* Hidden source canvases for rendering */}
        <canvas ref={baseCanvasRef} className="hidden" />
        <canvas ref={compareCanvasRef} className="hidden" />

        {/* Overlay mode */}
        {hasSelection && mode === 'overlay' && (
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <canvas
              ref={overlayCanvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="block"
              style={{ imageRendering: 'auto' }}
            />
            {/* Diff bounding boxes as DOM overlay for better interactivity */}
            {showDiffBoxes && diffBoxes.map((box, i) => (
              <div
                key={i}
                className="absolute border-2 border-dashed border-amber-400 bg-amber-400/10 pointer-events-none"
                style={{
                  left: box.x,
                  top: box.y,
                  width: box.width,
                  height: box.height,
                }}
              />
            ))}
          </div>
        )}

        {/* Side by side mode */}
        {hasSelection && mode === 'side-by-side' && (
          <div className="flex h-full">
            <div className="flex-1 overflow-hidden relative border-r border-neutral-300 dark:border-neutral-600">
              <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-emerald-500/90 text-white text-xs font-medium rounded">
                {t('bim.overlay.baseRevision')}
              </div>
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
              >
                <SideBySideCanvas revisionId={baseRevisionId} renderFn={drawMockPlan} />
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-red-500/90 text-white text-xs font-medium rounded">
                {t('bim.overlay.compareRevision')}
              </div>
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
              >
                <SideBySideCanvas revisionId={compareRevisionId} renderFn={drawMockPlan} />
              </div>
            </div>
          </div>
        )}

        {/* Swipe mode */}
        {hasSelection && mode === 'swipe' && (
          <div className="relative h-full w-full overflow-hidden">
            {/* Base layer (full width, clipped to left of divider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - swipePos}% 0 0)` }}
            >
              <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-emerald-500/90 text-white text-xs font-medium rounded">
                {t('bim.overlay.baseRevision')}
              </div>
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
              >
                <SwipeCanvas revisionId={baseRevisionId} tint="green" renderFn={drawMockPlan} />
              </div>
            </div>

            {/* Compare layer (full width, clipped to right of divider) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `inset(0 0 0 ${swipePos}%)` }}
            >
              <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-red-500/90 text-white text-xs font-medium rounded">
                {t('bim.overlay.compareRevision')}
              </div>
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'top left',
                }}
              >
                <SwipeCanvas revisionId={compareRevisionId} tint="red" renderFn={drawMockPlan} />
              </div>
            </div>

            {/* Swipe divider handle */}
            <div
              className="absolute top-0 bottom-0 z-20"
              style={{ left: `${swipePos}%`, transform: 'translateX(-50%)' }}
            >
              <div className="w-1 h-full bg-white dark:bg-neutral-200 shadow-lg" />
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsSwipeDragging(true);
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-12 rounded-lg bg-white dark:bg-neutral-200 shadow-xl border border-neutral-300 flex items-center justify-center cursor-ew-resize hover:bg-neutral-50 transition-colors"
              >
                <GripVertical size={16} className="text-neutral-500" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ToolbarButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  title: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon: Icon, onClick, title }) => (
  <button
    onClick={onClick}
    className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
    title={title}
  >
    <Icon size={15} />
  </button>
);

interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

const ModeButton: React.FC<ModeButtonProps> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
      active
        ? 'bg-white dark:bg-neutral-600 text-neutral-900 dark:text-neutral-100 shadow-sm'
        : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300',
    )}
  >
    <Icon size={14} />
    {label}
  </button>
);

interface SideBySideCanvasProps {
  revisionId: string;
  renderFn: (ctx: CanvasRenderingContext2D, revisionId: string, w: number, h: number, seed: number) => void;
}

const SideBySideCanvas: React.FC<SideBySideCanvasProps> = ({ revisionId, renderFn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !revisionId) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    renderFn(ctx, revisionId, CANVAS_WIDTH, CANVAS_HEIGHT, getRevisionSeed(revisionId));
  }, [revisionId, renderFn]);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" />;
};

interface SwipeCanvasProps {
  revisionId: string;
  tint: 'green' | 'red';
  renderFn: (ctx: CanvasRenderingContext2D, revisionId: string, w: number, h: number, seed: number) => void;
}

const SwipeCanvas: React.FC<SwipeCanvasProps> = ({ revisionId, tint, renderFn }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !revisionId) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw the plan
    renderFn(ctx, revisionId, CANVAS_WIDTH, CANVAS_HEIGHT, getRevisionSeed(revisionId));

    // Apply light tint overlay
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = tint === 'green' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();
  }, [revisionId, tint, renderFn]);

  return <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block" />;
};

export default DrawingOverlayComparisonPage;
