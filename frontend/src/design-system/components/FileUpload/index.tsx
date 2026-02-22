import React, { useCallback, useRef, useState, useId } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadedFile {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  url?: string;
  key?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

type FileContext = 'document' | 'image' | 'csv' | 'bim';

export interface FileUploadProps {
  /** Accepted file types (e.g. ".pdf,.jpg,.png") */
  accept?: string;
  /** Max number of files (default 1) */
  maxFiles?: number;
  /** Max file size in MB (default 50) */
  maxSizeMB?: number;
  /** Validation context matching backend whitelists */
  context?: FileContext;
  /** Controlled value */
  value?: UploadedFile[];
  /** Called when files change */
  onChange?: (files: UploadedFile[]) => void;
  /** Upload handler — receives File, should return key/URL. If omitted, files are queued locally. */
  onUpload?: (file: File) => Promise<string>;
  /** Error state */
  hasError?: boolean;
  disabled?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONTEXT_ACCEPT: Record<FileContext, string> = {
  document: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
  image: '.jpg,.jpeg,.png,.gif,.webp',
  csv: '.csv,.txt',
  bim: '.ifc',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generateId(): string {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isImageType(type: string): boolean {
  return type.startsWith('image/');
}

function getFileIcon(type: string) {
  if (isImageType(type)) return <ImageIcon size={18} className="text-blue-500" />;
  if (type === 'application/pdf') return <FileText size={18} className="text-red-500" />;
  return <File size={18} className="text-neutral-400" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  maxFiles = 1,
  maxSizeMB = 50,
  context,
  value,
  onChange,
  onUpload,
  hasError,
  disabled,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropId = useId();
  const [dragOver, setDragOver] = useState(false);
  const [internalFiles, setInternalFiles] = useState<UploadedFile[]>([]);

  const files = value ?? internalFiles;
  const setFiles = useCallback(
    (next: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])) => {
      if (typeof next === 'function') {
        const resolved = next(value ?? internalFiles);
        if (onChange) onChange(resolved);
        else setInternalFiles(resolved);
      } else {
        if (onChange) onChange(next);
        else setInternalFiles(next);
      }
    },
    [onChange, value, internalFiles],
  );

  const effectiveAccept = accept ?? (context ? CONTEXT_ACCEPT[context] : undefined);
  const canAddMore = files.length < maxFiles;
  const isMultiple = maxFiles > 1;

  // Validate and process selected files
  const processFiles = useCallback(
    async (fileList: FileList) => {
      const incoming = Array.from(fileList);
      const maxBytes = maxSizeMB * 1024 * 1024;
      const remaining = maxFiles - files.length;
      const batch = incoming.slice(0, Math.max(0, remaining));

      const newEntries: UploadedFile[] = batch.map((f) => {
        const entry: UploadedFile = {
          id: generateId(),
          file: f,
          name: f.name,
          size: f.size,
          type: f.type,
          progress: 0,
          status: 'pending',
        };

        if (f.size > maxBytes) {
          entry.status = 'error';
          entry.error = t('fileUpload.errorTooLarge', { max: String(maxSizeMB) });
        }

        return entry;
      });

      setFiles((prev) => [...prev, ...newEntries]);

      // Auto-upload valid files if handler provided
      if (onUpload) {
        for (const entry of newEntries) {
          if (entry.status === 'error' || !entry.file) continue;

          // Set uploading
          setFiles((prev) =>
            prev.map((f) => (f.id === entry.id ? { ...f, status: 'uploading' as const, progress: 10 } : f)),
          );

          try {
            const key = await onUpload(entry.file);
            setFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id ? { ...f, status: 'done' as const, progress: 100, key, url: key } : f,
              ),
            );
          } catch (err) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id
                  ? { ...f, status: 'error' as const, progress: 0, error: t('fileUpload.errorUploadFailed') }
                  : f,
              ),
            );
          }
        }
      } else {
        // Mark all as done if no upload handler
        setFiles((prev) =>
          prev.map((f) => (f.status === 'pending' ? { ...f, status: 'done' as const, progress: 100 } : f)),
        );
      }
    },
    [files.length, maxFiles, maxSizeMB, onUpload, setFiles],
  );

  const removeFile = useCallback(
    (id: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [setFiles],
  );

  // Drag handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && canAddMore) setDragOver(true);
    },
    [disabled, canAddMore],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (disabled || !canAddMore) return;
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [disabled, canAddMore, processFiles],
  );

  const handleClick = useCallback(() => {
    if (!disabled && canAddMore) inputRef.current?.click();
  }, [disabled, canAddMore]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        e.target.value = '';
      }
    },
    [processFiles],
  );

  // Image preview URLs
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const getPreview = useCallback(
    (entry: UploadedFile) => {
      if (entry.url && isImageType(entry.type)) return entry.url;
      if (previews[entry.id]) return previews[entry.id];
      if (entry.file && isImageType(entry.type)) {
        const url = URL.createObjectURL(entry.file);
        setPreviews((prev) => ({ ...prev, [entry.id]: url }));
        return url;
      }
      return null;
    },
    [previews],
  );

  return (
    <div className={cn('space-y-2', className)}>
      {/* Drop zone */}
      {canAddMore && (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={t('fileUpload.dropzoneLabel')}
          id={dropId}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          className={cn(
            'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors cursor-pointer',
            dragOver
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
              : hasError
                ? 'border-danger-300 bg-danger-50/30 dark:bg-danger-900/10'
                : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
            disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          )}
        >
          <Upload size={24} className={cn('text-neutral-400', dragOver && 'text-primary-500')} />
          <div>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              {dragOver ? t('fileUpload.dropHere') : t('fileUpload.dragOrClick')}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {effectiveAccept
                ? t('fileUpload.acceptedFormats', { formats: effectiveAccept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ') })
                : t('fileUpload.anyFormat')}
              {' '}&middot;{' '}
              {t('fileUpload.maxSize', { size: String(maxSizeMB) })}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={effectiveAccept}
        multiple={isMultiple}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((entry) => {
            const preview = getPreview(entry);
            return (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                  entry.status === 'error'
                    ? 'border-danger-200 bg-danger-50/50 dark:bg-danger-900/10 dark:border-danger-800'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900',
                )}
              >
                {/* Thumbnail or icon */}
                {preview ? (
                  <img
                    src={preview}
                    alt={entry.name}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(entry.type)}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {entry.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-400">{formatFileSize(entry.size)}</span>
                    {entry.status === 'uploading' && (
                      <span className="text-xs text-primary-600 flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin" />
                        {entry.progress}%
                      </span>
                    )}
                    {entry.status === 'done' && (
                      <CheckCircle2 size={12} className="text-success-500" />
                    )}
                    {entry.status === 'error' && (
                      <span className="text-xs text-danger-600 flex items-center gap-1">
                        <AlertCircle size={10} />
                        {entry.error}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {entry.status === 'uploading' && (
                    <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-300"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(entry.id);
                    }}
                    className="flex-shrink-0 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                    aria-label={t('fileUpload.removeFile')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
