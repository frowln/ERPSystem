import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Minus, Plus, X, ZoomIn } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { markupsApi, type DrawingMarkup } from '@/api/markups';
import { documentsApi } from '@/api/documents';
import { t } from '@/i18n';
import MarkupToolbar, { type MarkupTool } from './components/MarkupToolbar';
import MarkupCanvas from './components/MarkupCanvas';
import AnnotationPanel from './components/AnnotationPanel';

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

const DrawingViewerPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1); // MVP: single page; extend for real PDF
  const [zoom, setZoom] = useState(1);
  const [activeTool, setActiveTool] = useState<MarkupTool>('SELECT');
  const [activeColor, setActiveColor] = useState('#FF0000');
  const [activeStrokeWidth, setActiveStrokeWidth] = useState(2);
  const [selectedMarkupId, setSelectedMarkupId] = useState<string | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Fetch document meta
  const { data: documentData } = useQuery({
    queryKey: ['DOCUMENT', documentId],
    queryFn: () => documentsApi.getDocument(documentId!),
    enabled: Boolean(documentId),
  });

  // Fetch markups
  const { data: allMarkups = [] } = useQuery({
    queryKey: ['MARKUPS', documentId],
    queryFn: () => markupsApi.getMarkups(documentId!),
    enabled: Boolean(documentId),
  });

  const pageMarkups = allMarkups.filter((m) => m.pageNumber === currentPage);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof markupsApi.createMarkup>[1]) =>
      markupsApi.createMarkup(documentId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['MARKUPS', documentId] });
      toast.success(t('drawings.markup.savedSuccess'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof markupsApi.updateMarkup>[2] }) =>
      markupsApi.updateMarkup(documentId!, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['MARKUPS', documentId] });
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => markupsApi.deleteMarkup(documentId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['MARKUPS', documentId] });
      setSelectedMarkupId(null);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleCreateMarkup = useCallback(
    (partial: Partial<DrawingMarkup>) => {
      createMutation.mutate({
        markupType: partial.markupType ?? 'RECTANGLE',
        pageNumber: currentPage,
        x: partial.x ?? 0,
        y: partial.y ?? 0,
        width: partial.width,
        height: partial.height,
        color: partial.color ?? activeColor,
        strokeWidth: partial.strokeWidth ?? activeStrokeWidth,
        textContent: partial.textContent,
      });
    },
    [createMutation, currentPage, activeColor, activeStrokeWidth],
  );

  const handleResolveMarkup = useCallback(
    (id: string) => {
      updateMutation.mutate({ id, payload: { status: 'RESOLVED' } });
    },
    [updateMutation],
  );

  const handleDeleteMarkup = useCallback(
    (id: string) => {
      if (!window.confirm(t('drawings.markup.deleteConfirm'))) return;
      deleteMutation.mutate(id);
    },
    [deleteMutation],
  );

  const handleZoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, ZOOM_MAX));
  const handleZoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, ZOOM_MIN));
  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  const documentTitle = (documentData as { title?: string } | undefined)?.title;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-100 dark:bg-neutral-950">
      {/* Header bar */}
      <header className="flex items-center justify-between h-12 px-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="xs" onClick={() => navigate(-1)}>
            <X size={16} />
          </Button>
          <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-xs">
            {documentTitle ?? t('drawings.markup.title')}
          </h1>
        </div>

        {/* Page controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="xs" onClick={handlePrevPage} disabled={currentPage <= 1}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-xs text-neutral-600 dark:text-neutral-400 tabular-nums">
            {t('drawings.markup.page')} {currentPage} / {totalPages}
          </span>
          <Button variant="ghost" size="xs" onClick={handleNextPage} disabled={currentPage >= totalPages}>
            <ChevronRight size={16} />
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="xs" onClick={handleZoomOut} disabled={zoom <= ZOOM_MIN}>
            <Minus size={16} />
          </Button>
          <span className="text-xs text-neutral-600 dark:text-neutral-400 tabular-nums w-12 text-center flex items-center gap-0.5">
            <ZoomIn size={12} />
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="xs" onClick={handleZoomIn} disabled={zoom >= ZOOM_MAX}>
            <Plus size={16} />
          </Button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Left toolbar */}
        <div className="p-2 shrink-0">
          <MarkupToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            activeColor={activeColor}
            onColorChange={setActiveColor}
            activeStrokeWidth={activeStrokeWidth}
            onStrokeWidthChange={setActiveStrokeWidth}
          />
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-4">
          <div
            className="relative bg-white dark:bg-neutral-900 shadow-lg border border-neutral-200 dark:border-neutral-700"
            style={{
              width: 1190 * zoom,
              height: 842 * zoom,
              transformOrigin: 'top left',
            }}
          >
            {/* Grid background (placeholder for actual document rendering) */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width="100%"
              height="100%"
            >
              <defs>
                <pattern id="grid" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse">
                  <path
                    d={`M ${20 * zoom} 0 L 0 0 0 ${20 * zoom}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={0.3}
                    className="text-neutral-200 dark:text-neutral-800"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Markup overlay */}
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: 1190,
                height: 842,
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              <MarkupCanvas
                markups={pageMarkups}
                activeTool={activeTool}
                activeColor={activeColor}
                activeStrokeWidth={activeStrokeWidth}
                selectedMarkupId={selectedMarkupId}
                onSelectMarkup={setSelectedMarkupId}
                onCreateMarkup={handleCreateMarkup}
                zoom={zoom}
              />
            </div>
          </div>
        </div>

        {/* Right panel */}
        <AnnotationPanel
          markups={pageMarkups}
          selectedMarkupId={selectedMarkupId}
          onSelectMarkup={setSelectedMarkupId}
          onResolveMarkup={handleResolveMarkup}
          onDeleteMarkup={handleDeleteMarkup}
          collapsed={panelCollapsed}
          onToggleCollapsed={() => setPanelCollapsed((c) => !c)}
        />
      </div>
    </div>
  );
};

export default DrawingViewerPage;
