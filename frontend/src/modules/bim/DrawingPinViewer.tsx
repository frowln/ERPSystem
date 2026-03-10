import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  MapPin,
  Eye,
  EyeOff,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Trash2,
  User,
  Calendar,
  Flag,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import type { TaskStatus, TaskPriority } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DrawingPin {
  id: string;
  taskId: string;
  taskCode: string;
  taskTitle: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeName?: string;
  dueDate?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  isOverdue?: boolean;
  createdAt: string;
}

export interface DrawingPinViewerProps {
  imageUrl: string;
  pins: DrawingPin[];
  onPinCreate?: (x: number, y: number) => void;
  onPinClick?: (pin: DrawingPin) => void;
  onPinDelete?: (pinId: string) => void;
  readOnly?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<TaskStatus, string> = {
  BACKLOG: 'bg-neutral-400 border-neutral-500',
  TODO: 'bg-neutral-400 border-neutral-500',
  IN_PROGRESS: 'bg-primary-500 border-primary-600',
  IN_REVIEW: 'bg-amber-500 border-amber-600',
  DONE: 'bg-emerald-500 border-emerald-600',
  CANCELLED: 'bg-neutral-300 border-neutral-400',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: 'text-neutral-500',
  NORMAL: 'text-primary-500',
  HIGH: 'text-amber-500',
  URGENT: 'text-orange-500',
  CRITICAL: 'text-danger-500',
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.15;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DrawingPinViewer: React.FC<DrawingPinViewerProps> = ({
  imageUrl,
  pins,
  onPinCreate,
  onPinClick,
  onPinDelete,
  readOnly = false,
  className,
}) => {
  // Viewport state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // Pin mode
  const [pinMode, setPinMode] = useState(false);
  const [pinsVisible, setPinsVisible] = useState(true);

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [sidebarFilter, setSidebarFilter] = useState<TaskStatus | 'ALL'>('ALL');

  // Pin interaction
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

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
  const fitToScreen = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // -----------------------------------------------------------------------
  // Pan (mouse drag)
  // -----------------------------------------------------------------------
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (pinMode) return; // In pin mode, click = create pin
      if (e.button !== 0) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    },
    [pinMode, pan],
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

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // -----------------------------------------------------------------------
  // Pin creation (click on plan in pin mode)
  // -----------------------------------------------------------------------
  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      if (!pinMode || !onPinCreate || !imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        onPinCreate(Math.round(x * 100) / 100, Math.round(y * 100) / 100);
      }
    },
    [pinMode, onPinCreate],
  );

  // -----------------------------------------------------------------------
  // Pin click (show detail)
  // -----------------------------------------------------------------------
  const handlePinClick = useCallback(
    (e: React.MouseEvent, pin: DrawingPin) => {
      e.stopPropagation();
      setSelectedPinId((prev) => (prev === pin.id ? null : pin.id));
      onPinClick?.(pin);
    },
    [onPinClick],
  );

  // -----------------------------------------------------------------------
  // Navigate to pin from sidebar
  // -----------------------------------------------------------------------
  const panToPin = useCallback(
    (pin: DrawingPin) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const targetX = -(pin.x / 100) * rect.width * zoom + rect.width / 2;
      const targetY = -(pin.y / 100) * rect.height * zoom + rect.height / 2;
      setPan({ x: targetX, y: targetY });
      setHighlightedPinId(pin.id);
      setSelectedPinId(pin.id);
      setTimeout(() => setHighlightedPinId(null), 2000);
    },
    [zoom],
  );

  // Close popover on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPinId(null);
        if (pinMode) setPinMode(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pinMode]);

  // -----------------------------------------------------------------------
  // Filtered pins
  // -----------------------------------------------------------------------
  const filteredPins = pins.filter((p) => {
    if (sidebarFilter !== 'ALL' && p.status !== sidebarFilter) return false;
    if (sidebarSearch) {
      const q = sidebarSearch.toLowerCase();
      return (
        p.taskCode.toLowerCase().includes(q) ||
        p.taskTitle.toLowerCase().includes(q) ||
        (p.assigneeName?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Group by status for sidebar
  const statusGroups = (['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as TaskStatus[]).map(
    (status) => ({
      status,
      label: STATUS_LABEL[status],
      pins: filteredPins.filter((p) => p.status === status),
    }),
  );

  const selectedPin = pins.find((p) => p.id === selectedPinId) ?? null;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className={cn('flex h-full w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900', className)}>
      {/* ====== Main viewport ====== */}
      <div className="relative flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 px-2 py-1.5 shadow-sm">
          <ToolbarButton icon={ZoomIn} onClick={zoomIn} title={t('drawingPins.zoomIn')} />
          <ToolbarButton icon={ZoomOut} onClick={zoomOut} title={t('drawingPins.zoomOut')} />
          <ToolbarButton icon={Maximize2} onClick={fitToScreen} title={t('drawingPins.fitToScreen')} />
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
          <ToolbarButton
            icon={pinsVisible ? Eye : EyeOff}
            onClick={() => setPinsVisible(!pinsVisible)}
            title={t('drawingPins.togglePins')}
            active={pinsVisible}
          />
          {!readOnly && (
            <ToolbarButton
              icon={MapPin}
              onClick={() => setPinMode(!pinMode)}
              title={t('drawingPins.addPin')}
              active={pinMode}
              accent
            />
          )}
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-0.5" />
          <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums min-w-[40px] text-center select-none">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Pin mode banner */}
        {pinMode && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 px-4 py-2 shadow-sm">
            <MapPin size={16} className="text-primary-600 dark:text-primary-400" />
            <span className="text-sm text-primary-700 dark:text-primary-300 font-medium">
              {t('drawingPins.pinModeHint')}
            </span>
            <button
              onClick={() => setPinMode(false)}
              className="ml-2 p-0.5 rounded hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors"
            >
              <X size={14} className="text-primary-500" />
            </button>
          </div>
        )}

        {/* Viewport area */}
        <div
          ref={containerRef}
          className={cn(
            'w-full h-full overflow-hidden select-none',
            pinMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab',
          )}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
              src={imageUrl}
              alt="Floor plan"
              className="block max-w-none pointer-events-auto"
              draggable={false}
              onClick={handleImageClick}
            />

            {/* Pin markers */}
            {pinsVisible &&
              pins.map((pin) => {
                const isHovered = hoveredPinId === pin.id;
                const isSelected = selectedPinId === pin.id;
                const isHighlighted = highlightedPinId === pin.id;

                return (
                  <div
                    key={pin.id}
                    className="absolute pointer-events-auto"
                    style={{
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                      transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                      zIndex: isSelected || isHovered ? 30 : 10,
                    }}
                  >
                    {/* Pin dot */}
                    <button
                      className={cn(
                        'w-6 h-6 rounded-full border-2 shadow-md transition-all duration-200 flex items-center justify-center',
                        pin.isOverdue
                          ? 'bg-danger-500 border-danger-600 animate-pulse'
                          : STATUS_COLORS[pin.status],
                        (isSelected || isHighlighted) && 'ring-2 ring-white ring-offset-2 ring-offset-primary-500 scale-125',
                        isHovered && !isSelected && 'scale-110',
                      )}
                      onMouseEnter={() => setHoveredPinId(pin.id)}
                      onMouseLeave={() => setHoveredPinId(null)}
                      onClick={(e) => handlePinClick(e, pin)}
                      aria-label={`${pin.taskCode}: ${pin.taskTitle}`}
                    >
                      <MapPin size={12} className="text-white drop-shadow-sm" />
                    </button>

                    {/* Hover label */}
                    {isHovered && !isSelected && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-medium px-2.5 py-1 shadow-lg pointer-events-none">
                        {pin.taskCode}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-neutral-900 dark:border-t-neutral-100" />
                      </div>
                    )}

                    {/* Selected popover */}
                    {isSelected && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xl z-40 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                              {pin.taskCode}
                            </span>
                            <button
                              onClick={() => setSelectedPinId(null)}
                              className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                              <X size={14} className="text-neutral-400" />
                            </button>
                          </div>
                          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2">
                            {pin.taskTitle}
                          </h4>
                        </div>
                        <div className="px-4 py-3 space-y-2.5">
                          <PopoverRow
                            icon={AlertCircle}
                            label={t('drawingPins.pinDetailStatus')}
                            value={STATUS_LABEL[pin.status]}
                            valueClass={pin.isOverdue ? 'text-danger-500 font-medium' : undefined}
                          />
                          <PopoverRow
                            icon={Flag}
                            label={t('drawingPins.pinDetailPriority')}
                            value={pin.priority}
                            valueClass={PRIORITY_COLORS[pin.priority]}
                          />
                          {pin.assigneeName && (
                            <PopoverRow
                              icon={User}
                              label={t('drawingPins.pinDetailAssignee')}
                              value={pin.assigneeName}
                            />
                          )}
                          {pin.dueDate && (
                            <PopoverRow
                              icon={Calendar}
                              label={t('drawingPins.pinDetailDueDate')}
                              value={new Date(pin.dueDate).toLocaleDateString()}
                              valueClass={pin.isOverdue ? 'text-danger-500 font-medium' : undefined}
                            />
                          )}
                        </div>
                        {!readOnly && onPinDelete && (
                          <div className="px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-700">
                            <button
                              onClick={() => {
                                onPinDelete(pin.id);
                                setSelectedPinId(null);
                              }}
                              className="flex items-center gap-1.5 text-xs text-danger-500 hover:text-danger-600 transition-colors"
                            >
                              <Trash2 size={12} />
                              {t('drawingPins.pinDetailDelete')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-lg bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          title={t('drawingPins.sidebar')}
        >
          {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* ====== Sidebar ====== */}
      {sidebarOpen && (
        <aside className="w-72 border-l border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex flex-col shrink-0 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('drawingPins.sidebar')}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {t('drawingPins.allPins')} ({filteredPins.length})
            </p>
          </div>

          {/* Search & filter */}
          <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-700 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder={t('common.search')}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <select
              value={sidebarFilter}
              onChange={(e) => setSidebarFilter(e.target.value as TaskStatus | 'ALL')}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-primary-400"
            >
              <option value="ALL">{t('drawingPins.filterByStatusAll')}</option>
              {(['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Pin list */}
          <div className="flex-1 overflow-y-auto">
            {filteredPins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MapPin size={24} className="text-neutral-300 dark:text-neutral-600 mb-2" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('drawingPins.noPins')}
                </p>
              </div>
            ) : (
              statusGroups
                .filter((g) => g.pins.length > 0)
                .map((group) => (
                  <div key={group.status}>
                    <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-750 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                        {group.label}
                      </span>
                      <span className="text-xs text-neutral-400 tabular-nums">{group.pins.length}</span>
                    </div>
                    {group.pins.map((pin) => (
                      <button
                        key={pin.id}
                        onClick={() => panToPin(pin)}
                        className={cn(
                          'w-full text-left px-4 py-2.5 border-b border-neutral-50 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors',
                          selectedPinId === pin.id && 'bg-primary-50 dark:bg-primary-900/20',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-2.5 h-2.5 rounded-full shrink-0',
                              pin.isOverdue ? 'bg-danger-500 animate-pulse' : STATUS_COLORS[pin.status],
                            )}
                          />
                          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                            {pin.taskCode}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-800 dark:text-neutral-200 mt-0.5 line-clamp-1">
                          {pin.taskTitle}
                        </p>
                        {pin.assigneeName && (
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                            {pin.assigneeName}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                ))
            )}
          </div>
        </aside>
      )}
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
  active?: boolean;
  accent?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon: Icon, onClick, title, active, accent }) => (
  <button
    onClick={onClick}
    className={cn(
      'w-7 h-7 flex items-center justify-center rounded-md transition-colors',
      active && accent
        ? 'bg-primary-500 text-white'
        : active
          ? 'bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-100'
          : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700',
    )}
    title={title}
  >
    <Icon size={15} />
  </button>
);

interface PopoverRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  valueClass?: string;
}

const PopoverRow: React.FC<PopoverRowProps> = ({ icon: Icon, label, value, valueClass }) => (
  <div className="flex items-center gap-2 text-xs">
    <Icon size={13} className="text-neutral-400 shrink-0" />
    <span className="text-neutral-500 dark:text-neutral-400">{label}:</span>
    <span className={cn('text-neutral-800 dark:text-neutral-200 font-medium truncate', valueClass)}>
      {value}
    </span>
  </div>
);

export default DrawingPinViewer;
