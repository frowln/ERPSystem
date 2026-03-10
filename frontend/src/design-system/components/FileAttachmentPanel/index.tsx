import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Image, FileText, Plus, Trash2, File, Upload, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { attachmentsApi, type FileAttachment } from '@/api/attachments';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { ConfirmDialog } from '@/design-system/components/ConfirmDialog';
import { FormField, Input } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import { formatDate } from '@/lib/format';

interface FileAttachmentPanelProps {
  entityType: string;
  entityId: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function formatFileSize(bytes?: number): string {
  if (bytes == null || bytes === 0) return '\u2014';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType?: string) {
  if (!contentType) return <Paperclip size={16} className="text-neutral-400 dark:text-neutral-500" />;
  if (contentType.startsWith('image/')) return <Image size={16} className="text-blue-500 dark:text-blue-400" />;
  if (contentType === 'application/pdf') return <FileText size={16} className="text-red-500 dark:text-red-400" />;
  return <File size={16} className="text-neutral-400 dark:text-neutral-500" />;
}

export const FileAttachmentPanel: React.FC<FileAttachmentPanelProps> = ({ entityType, entityId }) => {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FileAttachment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['attachments', entityType, entityId],
    queryFn: () => attachmentsApi.getAttachments(entityType, entityId),
    enabled: !!entityId,
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!selectedFile) throw new Error('No file selected');
      return attachmentsApi.uploadFile(selectedFile, entityType, entityId, description || undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
      toast.success(t('fileAttachments.uploadSuccess'));
      closeAddModal();
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attachmentsApi.deleteAttachment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const closeAddModal = useCallback(() => {
    setAddOpen(false);
    setSelectedFile(null);
    setDescription('');
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t('fileAttachments.maxFileSize'));
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t('fileAttachments.maxFileSize'));
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleDownload = useCallback(async (file: FileAttachment) => {
    try {
      const url = await attachmentsApi.getDownloadUrl(file.id);
      window.open(url, '_blank');
    } catch {
      toast.error(t('common.error'));
    }
  }, []);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
          <Paperclip size={15} className="text-neutral-400 dark:text-neutral-500" />
          {t('fileAttachments.title')}
          {attachments.length > 0 && (
            <span className="ml-1 text-xs font-normal text-neutral-500 dark:text-neutral-400">
              ({attachments.length})
            </span>
          )}
        </h3>
        <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)}>
          <Plus size={14} className="mr-1" /> {t('fileAttachments.addBtn')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-6">
          <Paperclip size={24} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('fileAttachments.noFiles')}</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(file.contentType)}
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate block cursor-pointer hover:underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title={t('fileAttachments.downloadBtn')}
                  >
                    {file.fileName}
                  </button>
                  <div className="flex items-center gap-3 mt-0.5">
                    {file.fileSize != null && (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        {formatFileSize(file.fileSize)}
                      </span>
                    )}
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      {formatDate(file.createdAt)}
                    </span>
                    {file.uploadedBy && (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        {file.uploadedBy}
                      </span>
                    )}
                  </div>
                  {file.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                      {file.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-neutral-400 hover:text-blue-500 transition-colors"
                  aria-label={t('fileAttachments.downloadBtn')}
                  title={t('fileAttachments.downloadBtn')}
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(file)}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-neutral-400 hover:text-red-500 transition-colors"
                  aria-label={t('fileAttachments.deleteBtn')}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal open={addOpen} onClose={closeAddModal} title={t('fileAttachments.addTitle')}>
        <div className="space-y-4">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors
              ${isDragging
                ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
                : selectedFile
                  ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                  : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 bg-neutral-50 dark:bg-neutral-800'
              }
            `}
          >
            {isDragging ? (
              <>
                <Upload size={24} className="text-blue-500 dark:text-blue-400" />
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {t('fileAttachments.dropHere')}
                </p>
              </>
            ) : selectedFile ? (
              <>
                {getFileIcon(selectedFile.type)}
                <p className="text-sm text-neutral-800 dark:text-neutral-200 font-medium truncate max-w-full">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </>
            ) : (
              <>
                <Upload size={24} className="text-neutral-400 dark:text-neutral-500" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                  {t('fileAttachments.dragDrop')}
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">
                  {t('fileAttachments.maxFileSize')}
                </p>
              </>
            )}
          </div>

          <FormField label={t('fileAttachments.description')}>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('fileAttachments.addPlaceholder')}
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={closeAddModal}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? t('fileAttachments.uploading') : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={t('fileAttachments.deleteConfirm')}
        description={deleteTarget?.fileName}
        confirmVariant="danger"
        confirmLabel={t('fileAttachments.deleteBtn')}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default FileAttachmentPanel;
