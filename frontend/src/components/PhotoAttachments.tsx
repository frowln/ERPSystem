import React, { useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Plus, Trash2, Loader2, ImageOff, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { attachmentsApi, type FileAttachment } from '@/api/attachments';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface PhotoAttachmentsProps {
  /** Entity type identifier for the attachments API (e.g. 'DEFECT', 'DAILY_LOG', 'PUNCH_ITEM') */
  entityType: string;
  /** Entity ID to attach photos to */
  entityId: string;
  /** Whether to allow uploads (disable for read-only views) */
  readOnly?: boolean;
  /** Additional CSS class */
  className?: string;
}

export const PhotoAttachments: React.FC<PhotoAttachmentsProps> = ({
  entityType,
  entityId,
  readOnly = false,
  className,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const queryKey = ['attachments', entityType, entityId];

  const { data: attachments = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => attachmentsApi.getAttachments(entityType, entityId),
    enabled: !!entityId,
  });

  const imageAttachments = attachments.filter(
    (a) => a.contentType?.startsWith('image/') ?? a.fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i),
  );

  const uploadMutation = useMutation({
    mutationFn: (file: File) => attachmentsApi.uploadFile(file, entityType, entityId),
    onMutate: () => setUploading(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(t('photoAttachments.uploadSuccess'));
    },
    onError: () => {
      toast.error(t('photoAttachments.uploadError'));
    },
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attachmentsApi.deleteAttachment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(t('photoAttachments.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('photoAttachments.deleteError'));
    },
  });

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          toast.error(t('photoAttachments.onlyImages'));
          continue;
        }
        if (file.size > 20 * 1024 * 1024) {
          toast.error(t('photoAttachments.fileTooLarge'));
          continue;
        }
        uploadMutation.mutate(file);
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [uploadMutation],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (readOnly) return;
      const files = e.dataTransfer.files;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          uploadMutation.mutate(file);
        }
      }
    },
    [readOnly, uploadMutation],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const getThumbUrl = (att: FileAttachment) => {
    return att.downloadUrl || `/api/attachments/${att.id}/download-url`;
  };

  return (
    <section
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6',
        className,
      )}
      onDrop={!readOnly ? handleDrop : undefined}
      onDragOver={!readOnly ? handleDragOver : undefined}
    >
      <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
        <Camera size={16} />
        {t('photoAttachments.title')}
        {imageAttachments.length > 0 && (
          <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
            ({imageAttachments.length})
          </span>
        )}
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-neutral-400" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {imageAttachments.map((att) => (
            <PhotoThumb
              key={att.id}
              attachment={att}
              thumbUrl={getThumbUrl(att)}
              onDelete={readOnly ? undefined : () => deleteMutation.mutate(att.id)}
              onView={() => setLightboxUrl(getThumbUrl(att))}
              isDeleting={deleteMutation.isPending}
            />
          ))}

          {/* Add photo button */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                'aspect-square rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600',
                'flex flex-col items-center justify-center gap-2 transition-colors',
                'hover:border-primary-400 hover:bg-primary-50 dark:hover:border-primary-500 dark:hover:bg-primary-950/30',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                uploading && 'opacity-60 cursor-wait',
              )}
            >
              {uploading ? (
                <Loader2 size={24} className="animate-spin text-neutral-400" />
              ) : (
                <>
                  <Plus size={24} className="text-neutral-400 dark:text-neutral-500" />
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {t('photoAttachments.addPhoto')}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {!isLoading && imageAttachments.length === 0 && readOnly && (
        <div className="flex flex-col items-center justify-center py-6 text-neutral-400 dark:text-neutral-500">
          <ImageOff size={32} className="mb-2" />
          <p className="text-sm">{t('photoAttachments.noPhotos')}</p>
        </div>
      )}

      {!readOnly && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3">
          {t('photoAttachments.hint')}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80"
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

interface PhotoThumbProps {
  attachment: FileAttachment;
  thumbUrl: string;
  onDelete?: () => void;
  onView: () => void;
  isDeleting: boolean;
}

const PhotoThumb: React.FC<PhotoThumbProps> = ({
  attachment,
  thumbUrl,
  onDelete,
  onView,
  isDeleting,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer">
      {imgError ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
          <ImageOff size={24} />
          <span className="text-xs mt-1">{attachment.fileName}</span>
        </div>
      ) : (
        <img
          src={thumbUrl}
          alt={attachment.fileName}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          onClick={onView}
        />
      )}

      {/* Overlay with filename */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-[10px] text-white truncate">{attachment.fileName}</p>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-600"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};
