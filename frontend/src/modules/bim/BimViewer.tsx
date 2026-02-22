import React, { useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle, Box, RotateCcw } from 'lucide-react';

interface BimViewerProps {
  modelUrl: string;
  clashObjectIds?: number[];
  onObjectSelect?: (id: number) => void;
  height?: string;
}

/**
 * 3D BIM viewer using IFC.js (web-ifc-viewer).
 * Renders IFC models directly in the browser with orbit controls.
 * Falls back to a styled placeholder when WebGL is unavailable or the
 * IFC file cannot be loaded.
 *
 * Dependencies (install separately): web-ifc-viewer web-ifc three
 */
const BimViewer: React.FC<BimViewerProps> = ({
  modelUrl,
  clashObjectIds = [],
  onObjectSelect,
  height = '500px',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<unknown>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    let cancelled = false;

    const initViewer = async () => {
      setStatus('loading');
      setProgress(0);

      try {
        // Dynamic import to avoid loading IFC.js in pages that don't need it
        const { IfcViewerAPI } = await import('web-ifc-viewer');
        const THREE = await import('three');
        if (cancelled) return;

        const viewer = new IfcViewerAPI({
          container: containerRef.current!,
          backgroundColor: new THREE.Color(0xf0f4f8),
        });

        // Point IFC.js at the WASM binary
        await viewer.IFC.setWasmPath('/');
        viewer.axes.setAxes();
        viewer.grid.setGrid();
        viewerRef.current = viewer;

        setProgress(20);

        // Load model with progress callback
        const model = await viewer.IFC.loadIfcUrl(modelUrl, true, (p: number) => {
          if (!cancelled) setProgress(20 + Math.round(p * 70));
        });

        if (cancelled) return;
        setProgress(90);

        // Highlight clash elements in red
        if (clashObjectIds.length > 0 && model) {
          const material = new THREE.MeshLambertMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.8,
          });
          viewer.IFC.selector.highlightIfcItemsByID(model.modelID, clashObjectIds, material);
        }

        // Wire object selection callback
        if (onObjectSelect) {
          containerRef.current!.addEventListener('click', async () => {
            const result = await viewer.IFC.selector.pickIfcItem();
            if (result) onObjectSelect(result.id);
          });
        }

        setProgress(100);
        setStatus('loaded');
      } catch (err) {
        if (!cancelled) {
          console.error('BIM viewer error:', err);
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load BIM model');
          setStatus('error');
        }
      }
    };

    initViewer();

    return () => {
      cancelled = true;
      const viewer = viewerRef.current as { IFC?: { dispose?: () => void } } | null;
      try {
        viewer?.IFC?.dispose?.();
      } catch {
        // ignore cleanup errors
      }
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelUrl]);

  // Re-highlight clashes when the list changes
  useEffect(() => {
    const viewer = viewerRef.current as {
      IFC?: {
        selector?: {
          highlightIfcItemsByID?: (modelId: number, ids: number[], material: unknown) => void;
        };
      };
    } | null;
    if (!viewer || status !== 'loaded' || clashObjectIds.length === 0) return;

    import('three')
      .then(({ MeshLambertMaterial }) => {
        const material = new MeshLambertMaterial({ color: 0xff4444, transparent: true, opacity: 0.8 });
        viewer.IFC?.selector?.highlightIfcItemsByID?.(0, clashObjectIds, material);
      })
      .catch(() => {});
  }, [clashObjectIds, status]);

  const handleResetView = () => {
    const viewer = viewerRef.current as {
      context?: { resetCameraFitToScene?: () => void };
    } | null;
    viewer?.context?.resetCameraFitToScene?.();
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
      style={{ height }}
    >
      {/* 3D canvas container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-800 z-10">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Loading BIM model...
          </p>
          <div className="w-48 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{progress}%</p>
        </div>
      )}

      {/* Idle / no URL */}
      {status === 'idle' && !modelUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <Box className="w-12 h-12 text-neutral-400 mb-3" />
          <p className="text-sm text-neutral-500">No model URL provided</p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 z-10">
          <AlertTriangle className="w-10 h-10 text-warning-500 mb-3" />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Failed to load BIM model
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs text-center">
            {errorMsg || 'Check that the file is a valid IFC format and the URL is accessible.'}
          </p>
        </div>
      )}

      {/* Controls (visible when loaded) */}
      {status === 'loaded' && (
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleResetView}
            className="w-8 h-8 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 shadow-sm transition-colors"
            aria-label="Reset camera to fit scene"
            title="Reset view"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default BimViewer;
