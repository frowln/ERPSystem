import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFileDrop,
  children,
  className,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounterRef.current += 1;
      if (e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    [],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;
      if (disabled) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        onFileDrop(file);
      }
    },
    [disabled, onFileDrop],
  );

  // Reset drag counter if component loses focus
  useEffect(() => {
    return () => {
      dragCounterRef.current = 0;
    };
  }, []);

  return (
    <div
      className={cn('relative', className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary-50/90 dark:bg-primary-950/90 border-2 border-dashed border-primary-400 dark:border-primary-600 rounded-lg pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <Upload size={32} className="text-primary-500 dark:text-primary-400" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
              {t('messaging.dropFilesHere')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
