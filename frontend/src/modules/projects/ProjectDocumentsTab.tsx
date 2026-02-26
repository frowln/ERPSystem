import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Calendar, Download, ExternalLink, Upload, UploadCloud, X } from 'lucide-react';
import { MetricCard } from '@/design-system/components/MetricCard';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { formatMoneyCompact, formatDate, formatFileSize } from '@/lib/format';
import { t } from '@/i18n';
import { contractsApi } from '@/api/contracts';
import { documentsApi } from '@/api/documents';
import { StatusBadge, documentCategoryColorMap, documentCategoryLabels } from '@/design-system/components/StatusBadge';
import type { Project } from '@/types';
import toast from 'react-hot-toast';

const DOCUMENT_CATEGORIES = [
  'CONTRACT', 'ESTIMATE', 'SPECIFICATION', 'DRAWING', 'PERMIT',
  'ACT', 'INVOICE', 'PROTOCOL', 'CORRESPONDENCE', 'PHOTO', 'REPORT', 'OTHER',
] as const;

interface Props {
  project: Project | undefined;
}

export const ProjectDocumentsTab: React.FC<Props> = ({ project: p }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const { data: contractsData } = useQuery({
    queryKey: ['CONTRACTS', 'project', p?.id],
    queryFn: () => contractsApi.getContracts({ projectId: p!.id, size: 200 }),
    enabled: !!p?.id,
  });
  const { data: documentsData } = useQuery({
    queryKey: ['DOCUMENTS', 'project', p?.id],
    queryFn: () => documentsApi.getDocuments({ projectId: p!.id, size: 200 }),
    enabled: !!p?.id,
  });

  const projectContracts = contractsData?.content ?? [];
  const projectDocuments = documentsData?.content ?? [];

  const handleDownload = async (documentId: string) => {
    try {
      const url = await documentsApi.getDownloadUrl(documentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error(t('projects.documentsTab.downloadError'));
    }
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
    queryClient.invalidateQueries({ queryKey: ['DOCUMENTS', 'project', p?.id] });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={<FileText size={18} />} label={t('projects.documentsTab.contracts')} value={String(projectContracts.length)} />
        <MetricCard icon={<FileText size={18} />} label={t('projects.documentsTab.documents')} value={String(projectDocuments.length)} />
        <MetricCard icon={<Calendar size={18} />} label={t('projects.documentsTab.lastUpdate')} value={formatDate(p?.updatedAt ?? '')} />
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('projects.documentsTab.projectDocuments')}</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              iconLeft={<Upload size={14} />}
              onClick={() => setUploadModalOpen(true)}
            >
              {t('projects.documentsTab.addDocument')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/documents')}>
              {t('projects.documentsTab.openDocumentsRegistry')}
            </Button>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('projects.documentsTab.headerDocument')}
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('projects.documentsTab.headerCategory')}
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('projects.documentsTab.headerFile')}
              </th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('projects.documentsTab.headerCreated')}
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {projectDocuments.map((document) => (
              <tr key={document.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <td className="px-5 py-3 text-sm text-neutral-800 dark:text-neutral-200">
                  <div className="flex items-center gap-2">
                    <span>{document.title}</span>
                    {document.documentNumber && (
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{document.documentNumber}</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge
                    status={document.category}
                    colorMap={documentCategoryColorMap}
                    label={documentCategoryLabels[document.category] ?? document.category}
                    size="sm"
                  />
                </td>
                <td className="px-5 py-3 text-sm text-neutral-600 dark:text-neutral-300">
                  <div className="space-y-0.5">
                    <div>{document.fileName || t('documents.list.notUploaded')}</div>
                    {document.fileSize ? (
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">{formatFileSize(document.fileSize)}</div>
                    ) : null}
                  </div>
                </td>
                <td className="px-5 py-3 text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
                  {formatDate(document.createdAt)}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<ExternalLink size={14} />}
                      onClick={() => navigate(`/documents/${document.id}/edit`)}
                    >
                      {t('common.open')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconLeft={<Download size={14} />}
                      disabled={!document.storagePath}
                      onClick={() => void handleDownload(document.id)}
                    >
                      {t('common.download')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {projectDocuments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  {t('projects.documentsTab.noDocuments')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('projects.documentsTab.relatedContracts')}</h3>
          <Button variant="secondary" size="sm" onClick={() => navigate('/contracts')}>{t('projects.documentsTab.openContractRegistry')}</Button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 dark:bg-neutral-800">
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.documentsTab.headerNumber')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.documentsTab.headerContract')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.documentsTab.headerCounterparty')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.documentsTab.headerAmount')}</th>
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('projects.documentsTab.headerDeadline')}</th>
            </tr>
          </thead>
          <tbody>
            {projectContracts.map((contract) => (
              <tr key={contract.id} className="border-b border-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800">
                <td className="px-5 py-3 text-xs font-mono text-neutral-500 dark:text-neutral-400">{contract.number}</td>
                <td className="px-5 py-3 text-sm text-neutral-800 dark:text-neutral-200">{contract.name}</td>
                <td className="px-5 py-3 text-sm text-neutral-600">{contract.partnerName}</td>
                <td className="px-5 py-3 text-sm font-medium tabular-nums">{formatMoneyCompact(contract.totalWithVat)}</td>
                <td className="px-5 py-3 text-sm tabular-nums text-neutral-500 dark:text-neutral-400">{formatDate(contract.plannedEndDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upload Document Modal */}
      {p?.id && (
        <UploadDocumentModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          projectId={p.id}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

// ─── Upload Document Modal ────────────────────────────────────────────────────

interface UploadDocumentModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

function UploadDocumentModal({ open, onClose, projectId, onSuccess }: UploadDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setTitle('');
    setCategory('');
    setDocumentNumber('');
    setFile(null);
    setIsDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const createAndUploadMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('TITLE_REQUIRED');
      if (!file) throw new Error('FILE_REQUIRED');

      // Step 1: create document record
      const doc = await documentsApi.createDocument({
        title: title.trim(),
        projectId,
        category: category || undefined,
        documentNumber: documentNumber.trim() || undefined,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      });

      // Step 2: upload file
      await documentsApi.uploadDocumentFile(doc.id, file);

      return doc;
    },
    onSuccess: () => {
      toast.success(t('projects.documentsTab.uploadSuccess'));
      resetForm();
      onSuccess();
    },
    onError: (err: Error) => {
      if (err.message === 'TITLE_REQUIRED') {
        toast.error(t('projects.documentsTab.titleRequired'));
      } else if (err.message === 'FILE_REQUIRED') {
        toast.error(t('projects.documentsTab.fileRequired'));
      } else {
        toast.error(t('projects.documentsTab.uploadError'));
      }
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!title.trim()) {
        // Auto-fill title from filename (without extension)
        const nameWithoutExt = droppedFile.name.replace(/\.[^.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  }, [title]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title.trim()) {
        const nameWithoutExt = selected.name.replace(/\.[^.]+$/, '');
        setTitle(nameWithoutExt);
      }
    }
  }, [title]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('projects.documentsTab.addDocumentTitle')}
      description={t('projects.documentsTab.addDocumentDesc')}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            iconLeft={<Upload size={14} />}
            loading={createAndUploadMutation.isPending}
            disabled={!title.trim() || !file}
            onClick={() => createAndUploadMutation.mutate()}
          >
            {createAndUploadMutation.isPending
              ? t('projects.documentsTab.uploading')
              : t('projects.documentsTab.uploadBtn')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('projects.documentsTab.fieldTitle')} <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('projects.documentsTab.fieldTitlePlaceholder')}
            className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Category + Number row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('projects.documentsTab.fieldCategory')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">{t('projects.documentsTab.fieldCategoryPlaceholder')}</option>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {documentCategoryLabels[cat] ?? cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('projects.documentsTab.fieldNumber')}
            </label>
            <input
              type="text"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder={t('projects.documentsTab.fieldNumberPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* File drop zone */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {t('projects.documentsTab.fieldFile')} <span className="text-danger-500">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />
          {file ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
              <FileText size={20} className="text-success-600 dark:text-success-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-success-800 dark:text-success-200 truncate">{file.name}</p>
                <p className="text-xs text-success-600 dark:text-success-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1 text-success-600 hover:text-success-800 dark:text-success-400 dark:hover:text-success-200 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center gap-2 px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <UploadCloud size={32} className={isDragOver ? 'text-primary-500' : 'text-neutral-400 dark:text-neutral-500'} />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('projects.documentsTab.fieldFileDrag')}
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {t('projects.documentsTab.fieldFileMaxSize')}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
