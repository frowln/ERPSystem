import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Camera, Plus, Trash2, X, ImageOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface PhotoPreviewProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
  readOnly?: boolean;
  className?: string;
}

/**
 * Local-only photo preview component that holds File objects in state
 * and shows blob URL previews BEFORE uploading to the server.
 *
 * Used in create-mode forms where the entity ID doesn't exist yet.
 */
export const PhotoPreview: React.FC<PhotoPreviewProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSizeMb = 20,
  readOnly = false,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Build blob URLs for all files and revoke them on change/unmount
  const blobUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => {
      blobUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [blobUrls]);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newFiles: File[] = [];
      const maxSizeBytes = maxSizeMb * 1024 * 1024;

      for (let i = 0; i < incoming.length; i++) {
        const file = incoming[i];
        if (!file.type.startsWith('image/')) {
          toast.error(t('photoPreview.onlyImages'));
          continue;
        }
        if (file.size > maxSizeBytes) {
          toast.error(t('photoPreview.fileTooLarge', { max: String(maxSizeMb) }));
          continue;
        }
        newFiles.push(file);
      }

      if (newFiles.length === 0) return;

      const combined = [...files, ...newFiles];
      if (combined.length > maxFiles) {
        toast.error(t('photoPreview.maxFiles', { max: String(maxFiles) }));
        onFilesChange(combined.slice(0, maxFiles));
      } else {
        onFilesChange(combined);
      }
    },
    [files, onFilesChange, maxFiles, maxSizeMb],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      addFiles(e.target.files);
      e.target.value = '';
    },
    [addFiles],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const next = files.filter((_, i) => i !== index);
      onFilesChange(next);
    },
    [files, onFilesChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (readOnly) return;
      addFiles(e.dataTransfer.files);
    },
    [readOnly, addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  return (
    <section
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6',
        dragOver && !readOnly && 'ring-2 ring-primary-400 border-primary-400',
        className,
      )}
      onDrop={!readOnly ? handleDrop : undefined}
      onDragOver={!readOnly ? handleDragOver : undefined}
      onDragLeave={!readOnly ? handleDragLeave : undefined}
    >
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
        <Camera size={16} />
        {t('photoPreview.title')}
        {files.length > 0 && (
          <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
            ({files.length})
          </span>
        )}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {files.map((file, index) => (
          <PreviewThumb
            key={`${file.name}-${file.size}-${index}`}
            file={file}
            blobUrl={blobUrls[index]}
            onDelete={readOnly ? undefined : () => handleRemove(index)}
            onView={() => setLightboxUrl(blobUrls[index])}
          />
        ))}

        {/* Add photo button */}
        {!readOnly && files.length < maxFiles && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600',
              'flex flex-col items-center justify-center gap-2 transition-colors',
              'hover:border-primary-400 hover:bg-primary-50 dark:hover:border-primary-500 dark:hover:bg-primary-950/30',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            )}
          >
            <Plus size={24} className="text-neutral-400 dark:text-neutral-500" />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('photoPreview.addPhoto')}
            </span>
          </button>
        )}
      </div>

      {files.length === 0 && !readOnly && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3">
          {t('photoPreview.dragHint')}
        </p>
      )}

      {/* Hidden file input with camera capture for mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-neutral-300 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={28} />
          </button>
          <img
            src={lightboxUrl}
            alt={t('photoAttachments.lightboxAlt')}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};

// ---------------------------------------------------------------------------
// Preview thumbnail for a local File
// ---------------------------------------------------------------------------
interface PreviewThumbProps {
  file: File;
  blobUrl: string;
  onDelete?: () => void;
  onView: () => void;
}

const PreviewThumb: React.FC<PreviewThumbProps> = ({ file, blobUrl, onDelete, onView }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer">
      {imgError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
          <ImageOff size={24} />
          <span className="text-xs mt-1 px-1 truncate max-w-full">{file.name}</span>
        </div>
      ) : (
        <img
          src={blobUrl}
          alt={file.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          onClick={onView}
        />
      )}

      {/* Overlay with filename */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-white truncate">{file.name}</p>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={t('common.delete')}
          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-600"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};
