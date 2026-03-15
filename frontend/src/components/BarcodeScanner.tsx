import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const animFrameRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const hasBarcodeApi = 'BarcodeDetector' in window;

  const stopStream = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const detect = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0) {
        const code = barcodes[0].rawValue;
        if (code) {
          stopStream();
          onScan(code);
          return;
        }
      }
    } catch {
      // detection cycle continues
    }
    animFrameRef.current = requestAnimationFrame(detect);
  }, [onScan, stopStream]);

  const handleManualSubmit = useCallback(() => {
    const trimmed = manualCode.trim();
    if (trimmed) {
      onScan(trimmed);
    }
  }, [manualCode, onScan]);

  useEffect(() => {
    if (!hasBarcodeApi) return; // skip camera init when API unsupported

    let cancelled = false;

    async function startScanner() {
      // Check BarcodeDetector support
      if (!('BarcodeDetector' in window)) {
        setError(t('warehouse.scanner.unsupported'));
        return;
      }

      try {
        detectorRef.current = new BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'data_matrix', 'itf'],
        });
      } catch {
        setError(t('warehouse.scanner.unsupported'));
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanning(true);
          animFrameRef.current = requestAnimationFrame(detect);
        }
      } catch (err) {
        if (!cancelled) {
          setError(t('warehouse.scanner.cameraError'));
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [detect, stopStream, hasBarcodeApi]);

  // ---------------------------------------------------------------------------
  // Manual input fallback (rendered when BarcodeDetector is unavailable)
  // ---------------------------------------------------------------------------
  const renderManualInput = () => (
    <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 space-y-4">
      <div className="text-center space-y-2">
        <Camera className="w-10 h-10 mx-auto text-neutral-400 dark:text-neutral-500" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('warehouse.scanner.unsupported')}
        </p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleManualSubmit();
          }}
          placeholder={t('warehouse.scanner.manualPlaceholder')}
          autoFocus
          className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>
          {t('warehouse.scanner.manualSubmit')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
      <div className="relative w-full max-w-lg mx-4">
        {/* Close button */}
        <button
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="absolute top-2 right-2 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!hasBarcodeApi ? (
          renderManualInput()
        ) : error ? (
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-warning-500" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{error}</p>
            <p className="text-xs text-neutral-500">{t('warehouse.scanner.manualHint')}</p>
            <div className="flex gap-2 justify-center">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualSubmit();
                }}
                placeholder={t('warehouse.scanner.manualPlaceholder')}
                className="flex-1 max-w-xs rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>
                {t('warehouse.scanner.manualSubmit')}
              </Button>
            </div>
            <Button variant="secondary" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="w-full"
              playsInline
              muted
              autoPlay
            />
            {/* Scan guide overlay */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-40 border-2 border-white/60 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                  {/* Animated scan line */}
                  <div className="absolute left-2 right-2 h-0.5 bg-green-400/80 animate-pulse top-1/2" />
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="text-sm text-white/80 bg-black/50 px-3 py-1 rounded-full">
                {t('warehouse.scanner.instruction')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Type declaration for BarcodeDetector (not yet in lib.dom.d.ts)
declare global {
  interface BarcodeDetector {
    detect(source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | ImageBitmap): Promise<DetectedBarcode[]>;
  }
  // eslint-disable-next-line no-var
  var BarcodeDetector: {
    prototype: BarcodeDetector;
    new (options?: { formats: string[] }): BarcodeDetector;
    getSupportedFormats(): Promise<string[]>;
  };
  interface DetectedBarcode {
    rawValue: string;
    format: string;
    boundingBox: DOMRectReadOnly;
    cornerPoints: { x: number; y: number }[];
  }
}
