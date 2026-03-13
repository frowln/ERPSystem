import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, QrCode, X, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';

const QrScanPage: React.FC = () => {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const animFrameRef = useRef<number>(0);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleDetectedUrl = useCallback(
    (raw: string) => {
      // Try to extract fleet ID from URL like /fleet/123 or full URL
      const fleetMatch = raw.match(/\/fleet\/([a-zA-Z0-9-]+)/);
      const maintMatch = raw.match(/\/maintenance\/equipment\/([a-zA-Z0-9-]+)/);
      if (fleetMatch) {
        navigate(`/fleet/${fleetMatch[1]}`);
        return;
      }
      if (maintMatch) {
        navigate(`/maintenance/equipment/${maintMatch[1]}`);
        return;
      }
      // If it's a full URL on the same origin, navigate to the path
      try {
        const url = new URL(raw);
        if (url.origin === window.location.origin) {
          navigate(url.pathname);
          return;
        }
      } catch {
        // Not a valid URL — treat as equipment code
      }
      // Fall back: search by code
      navigate(`/fleet?search=${encodeURIComponent(raw)}`);
    },
    [navigate],
  );

  const detect = useCallback(async () => {
    if (!detectorRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detect);
      return;
    }
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes.length > 0 && barcodes[0].rawValue) {
        stopStream();
        handleDetectedUrl(barcodes[0].rawValue);
        return;
      }
    } catch {
      // continue scanning
    }
    animFrameRef.current = requestAnimationFrame(detect);
  }, [handleDetectedUrl, stopStream]);

  const startCamera = useCallback(async () => {
    setCameraError(null);

    if (!('BarcodeDetector' in window)) {
      setCameraError(t('fleet.qr.cameraUnsupported'));
      return;
    }

    try {
      detectorRef.current = new BarcodeDetector({ formats: ['qr_code'] });
    } catch {
      setCameraError(t('fleet.qr.cameraUnsupported'));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        animFrameRef.current = requestAnimationFrame(detect);
      }
    } catch {
      setCameraError(t('fleet.qr.cameraError'));
    }
  }, [detect]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetectedUrl(manualCode.trim());
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('fleet.qr.scanTitle')}
        breadcrumbs={[
          { label: t('fleet.detail.breadcrumbHome'), href: '/' },
          { label: t('fleet.detail.breadcrumbFleet'), href: '/fleet' },
          { label: t('fleet.qr.scanTitle') },
        ]}
        backTo="/fleet"
      />

      <div className="max-w-lg mx-auto space-y-6">
        {/* Camera section */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          {cameraActive ? (
            <div className="relative">
              <video ref={videoRef} className="w-full" playsInline muted autoPlay />
              {/* Scan guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-56 h-56 border-2 border-white/60 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                  <div className="absolute left-3 right-3 h-0.5 bg-green-400/80 animate-pulse top-1/2" />
                </div>
              </div>
              {/* Hint */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-sm text-white/90 bg-black/50 px-4 py-1.5 rounded-full">
                  {t('fleet.qr.scanHint')}
                </span>
              </div>
              {/* Stop button */}
              <button
                onClick={stopStream}
                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              {cameraError ? (
                <>
                  <AlertTriangle size={40} className="text-warning-500 mb-3" />
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-4">{cameraError}</p>
                </>
              ) : (
                <>
                  <div className={cn(
                    'w-20 h-20 rounded-2xl flex items-center justify-center mb-4',
                    'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
                  )}>
                    <QrCode size={36} />
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center mb-1">
                    {t('fleet.qr.scanHint')}
                  </p>
                </>
              )}
              <Button
                iconLeft={<Camera size={16} />}
                onClick={startCamera}
                className="mt-4"
              >
                {t('fleet.qr.openCamera')}
              </Button>
            </div>
          )}
        </div>

        {/* Manual entry */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
            {t('fleet.qr.manualEntry')}
          </h3>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              placeholder={t('fleet.qr.manualPlaceholder')}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" iconLeft={<Search size={16} />} disabled={!manualCode.trim()}>
              {t('fleet.qr.search')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QrScanPage;
