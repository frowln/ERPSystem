import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  Check,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Zap,
  Eye,
  PieChart,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatDateTime } from '@/lib/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DocClassificationType =
  | 'KS2' | 'KS3' | 'AOSR' | 'CERTIFICATE' | 'TU'
  | 'EXEC_SCHEME' | 'PRESCRIPTION' | 'QUALITY_PASSPORT'
  | 'WAYBILL' | 'ACCEPTANCE_ACT' | 'DRAWING' | 'SPECIFICATION'
  | 'CONTRACT' | 'INVOICE' | 'OTHER';

type ProcessingStatus = 'uploading' | 'processing' | 'done' | 'failed';

interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  accepted: boolean;
}

interface ProcessedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadProgress: number;
  status: ProcessingStatus;
  detectedType?: DocClassificationType;
  confidence?: number;
  extractedFields?: ExtractedField[];
  processedAt?: Date;
  thumbnailColor?: string;
}

interface HistoryEntry {
  id: string;
  fileName: string;
  detectedType: DocClassificationType;
  confidence: number;
  processedAt: Date;
  status: 'done' | 'failed';
}

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const DOC_TYPES: DocClassificationType[] = [
  'KS2', 'KS3', 'AOSR', 'CERTIFICATE', 'TU',
  'EXEC_SCHEME', 'PRESCRIPTION', 'QUALITY_PASSPORT',
  'WAYBILL', 'ACCEPTANCE_ACT', 'DRAWING', 'SPECIFICATION',
  'CONTRACT', 'INVOICE', 'OTHER',
];

function getDocTypeLabel(type: DocClassificationType): string {
  return t(`documents.recognition.docTypes.${type}`);
}

function getStatusLabel(status: ProcessingStatus): string {
  return t(`documents.recognition.statuses.${status}`);
}

const statusColorMap: Record<ProcessingStatus, string> = {
  uploading: 'blue',
  processing: 'yellow',
  done: 'green',
  failed: 'red',
};

function confidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-success-600 dark:text-success-400';
  if (confidence >= 70) return 'text-warning-600 dark:text-warning-400';
  return 'text-danger-600 dark:text-danger-400';
}

function confidenceBg(confidence: number): string {
  if (confidence >= 90) return 'bg-success-50 dark:bg-success-900/20';
  if (confidence >= 70) return 'bg-warning-50 dark:bg-warning-900/20';
  return 'bg-danger-50 dark:bg-danger-900/20';
}

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('image')) return Image;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ---------------------------------------------------------------------------
// Mock classification engine
// ---------------------------------------------------------------------------

const MOCK_EXTRACTIONS: Record<DocClassificationType, () => ExtractedField[]> = {
  KS2: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `КС-2 №${randomBetween(1, 99)}`, confidence: 95, accepted: false },
    { key: 'date', label: t('documents.recognition.fields.date'), value: '15.02.2026', confidence: 92, accepted: false },
    { key: 'project', label: t('documents.recognition.fields.project'), value: 'ЖК "Северное сияние"', confidence: 88, accepted: false },
    { key: 'contractor', label: t('documents.recognition.fields.contractor'), value: 'ООО "СтройМонтаж"', confidence: 85, accepted: false },
    { key: 'amount', label: t('documents.recognition.fields.amount'), value: `${randomBetween(500, 9999)} 000 ₽`, confidence: 91, accepted: false },
  ],
  KS3: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `КС-3 №${randomBetween(1, 50)}`, confidence: 93, accepted: false },
    { key: 'date', label: t('documents.recognition.fields.date'), value: '28.02.2026', confidence: 90, accepted: false },
    { key: 'project', label: t('documents.recognition.fields.project'), value: 'БЦ "Горизонт"', confidence: 82, accepted: false },
    { key: 'amount', label: t('documents.recognition.fields.amount'), value: `${randomBetween(1000, 50000)} 000 ₽`, confidence: 94, accepted: false },
  ],
  AOSR: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `АОСР-${randomBetween(100, 999)}`, confidence: 96, accepted: false },
    { key: 'date', label: t('documents.recognition.fields.date'), value: '10.03.2026', confidence: 89, accepted: false },
    { key: 'workType', label: t('documents.recognition.fields.workType'), value: 'Бетонирование фундамента', confidence: 78, accepted: false },
    { key: 'contractor', label: t('documents.recognition.fields.contractor'), value: 'ООО "ФундаментСтрой"', confidence: 84, accepted: false },
  ],
  CERTIFICATE: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `СЕРТ-${randomBetween(1000, 9999)}`, confidence: 97, accepted: false },
    { key: 'material', label: t('documents.recognition.fields.material'), value: 'Арматура А500С ⌀12', confidence: 91, accepted: false },
    { key: 'manufacturer', label: t('documents.recognition.fields.manufacturer'), value: 'НЛМК', confidence: 88, accepted: false },
    { key: 'validUntil', label: t('documents.recognition.fields.validUntil'), value: '31.12.2027', confidence: 94, accepted: false },
  ],
  CONTRACT: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `ДОГ-${randomBetween(100, 999)}/2026`, confidence: 94, accepted: false },
    { key: 'date', label: t('documents.recognition.fields.date'), value: '01.01.2026', confidence: 91, accepted: false },
    { key: 'contractor', label: t('documents.recognition.fields.contractor'), value: 'ООО "ТехноСервис"', confidence: 87, accepted: false },
    { key: 'amount', label: t('documents.recognition.fields.amount'), value: `${randomBetween(5000, 99999)} 000 ₽`, confidence: 79, accepted: false },
  ],
  INVOICE: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `СФ-${randomBetween(1, 9999)}`, confidence: 96, accepted: false },
    { key: 'date', label: t('documents.recognition.fields.date'), value: '05.03.2026', confidence: 93, accepted: false },
    { key: 'amount', label: t('documents.recognition.fields.amount'), value: `${randomBetween(100, 9999)} 000 ₽`, confidence: 95, accepted: false },
    { key: 'contractor', label: t('documents.recognition.fields.contractor'), value: 'ООО "МатериалОпт"', confidence: 86, accepted: false },
  ],
  TU: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `ТУ-${randomBetween(100, 999)}`, confidence: 88, accepted: false },
    { key: 'date', label: t('documents.recognition.fields.date'), value: '20.01.2026', confidence: 85, accepted: false },
    { key: 'project', label: t('documents.recognition.fields.project'), value: 'Микрорайон "Весна"', confidence: 72, accepted: false },
  ],
  EXEC_SCHEME: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `ИС-${randomBetween(1, 200)}`, confidence: 82, accepted: false },
    { key: 'workType', label: t('documents.recognition.fields.workType'), value: 'Монтаж каркаса 3 этажа', confidence: 75, accepted: false },
    { key: 'date', label: t('documents.recognition.fields.date'), value: '08.03.2026', confidence: 80, accepted: false },
  ],
  PRESCRIPTION: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `ПРЕД-${randomBetween(1, 100)}`, confidence: 90, accepted: false },
    { key: 'date', label: t('documents.recognition.fields.date'), value: '25.02.2026', confidence: 87, accepted: false },
    { key: 'project', label: t('documents.recognition.fields.project'), value: 'ЖК "Парковый"', confidence: 83, accepted: false },
  ],
  QUALITY_PASSPORT: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `ПК-${randomBetween(100, 999)}`, confidence: 93, accepted: false },
    { key: 'material', label: t('documents.recognition.fields.material'), value: 'Бетон B25 F150 W6', confidence: 89, accepted: false },
    { key: 'manufacturer', label: t('documents.recognition.fields.manufacturer'), value: 'ЖБИ-5', confidence: 86, accepted: false },
  ],
  WAYBILL: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `ТН-${randomBetween(1000, 9999)}`, confidence: 94, accepted: false },
    { key: 'date', label: t('documents.recognition.fields.date'), value: '07.03.2026', confidence: 91, accepted: false },
    { key: 'contractor', label: t('documents.recognition.fields.contractor'), value: 'ООО "ЛогистикПро"', confidence: 82, accepted: false },
  ],
  ACCEPTANCE_ACT: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `АКТ-${randomBetween(1, 500)}`, confidence: 91, accepted: false },
    { key: 'date', label: t('documents.recognition.fields.date'), value: '01.03.2026', confidence: 88, accepted: false },
    { key: 'project', label: t('documents.recognition.fields.project'), value: 'ТЦ "Мега Центр"', confidence: 80, accepted: false },
  ],
  DRAWING: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `АР-${randomBetween(100, 999)}`, confidence: 87, accepted: false },
    { key: 'project', label: t('documents.recognition.fields.project'), value: 'ЖК "Северное сияние"', confidence: 76, accepted: false },
  ],
  SPECIFICATION: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `СПЕЦ-${randomBetween(1, 100)}`, confidence: 85, accepted: false },
    { key: 'project', label: t('documents.recognition.fields.project'), value: 'БЦ "Горизонт"', confidence: 79, accepted: false },
  ],
  OTHER: () => [
    { key: 'docNumber', label: t('documents.recognition.fields.docNumber'), value: `DOC-${randomBetween(1, 9999)}`, confidence: 60, accepted: false },
  ],
};

function simulateClassification(): { type: DocClassificationType; confidence: number } {
  const weighted: { type: DocClassificationType; weight: number }[] = [
    { type: 'KS2', weight: 15 },
    { type: 'KS3', weight: 10 },
    { type: 'AOSR', weight: 12 },
    { type: 'CERTIFICATE', weight: 10 },
    { type: 'CONTRACT', weight: 8 },
    { type: 'INVOICE', weight: 8 },
    { type: 'DRAWING', weight: 7 },
    { type: 'SPECIFICATION', weight: 5 },
    { type: 'TU', weight: 4 },
    { type: 'EXEC_SCHEME', weight: 5 },
    { type: 'PRESCRIPTION', weight: 4 },
    { type: 'QUALITY_PASSPORT', weight: 4 },
    { type: 'WAYBILL', weight: 3 },
    { type: 'ACCEPTANCE_ACT', weight: 3 },
    { type: 'OTHER', weight: 2 },
  ];
  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  let picked = weighted[weighted.length - 1].type;
  for (const w of weighted) {
    r -= w.weight;
    if (r <= 0) { picked = w.type; break; }
  }
  const confidence = randomBetween(55, 99);
  return { type: picked, confidence };
}

const THUMB_COLORS = [
  'bg-blue-100 dark:bg-blue-900/30',
  'bg-emerald-100 dark:bg-emerald-900/30',
  'bg-amber-100 dark:bg-amber-900/30',
  'bg-violet-100 dark:bg-violet-900/30',
  'bg-rose-100 dark:bg-rose-900/30',
  'bg-cyan-100 dark:bg-cyan-900/30',
];

// Mock history data
function generateHistory(): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  const types = DOC_TYPES.filter(t => t !== 'OTHER');
  for (let i = 0; i < 25; i++) {
    const type = types[randomBetween(0, types.length - 1)];
    entries.push({
      id: `hist-${i}`,
      fileName: `document_${randomBetween(1000, 9999)}.pdf`,
      detectedType: type,
      confidence: randomBetween(60, 99),
      processedAt: new Date(Date.now() - randomBetween(0, 7 * 24 * 60 * 60 * 1000)),
      status: Math.random() > 0.1 ? 'done' : 'failed',
    });
  }
  return entries.sort((a, b) => b.processedAt.getTime() - a.processedAt.getTime());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SmartDocRecognitionPage: React.FC = () => {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'batch' | 'history'>('batch');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history] = useState<HistoryEntry[]>(() => generateHistory());

  // Stats
  const stats = useMemo(() => {
    const allDone = [...documents.filter(d => d.status === 'done'), ...history.filter(h => h.status === 'done')];
    const todayDone = allDone.filter(d => {
      const processed = 'processedAt' in d && d.processedAt ? new Date(d.processedAt) : new Date();
      return processed.toDateString() === new Date().toDateString();
    });

    const confidences = allDone.map(d => d.confidence ?? 0).filter(c => c > 0);
    const avgConfidence = confidences.length > 0
      ? Math.round(confidences.reduce((s, c) => s + c, 0) / confidences.length)
      : 0;

    const typeDistribution: Record<string, number> = {};
    for (const d of allDone) {
      const type = 'detectedType' in d ? (d.detectedType ?? 'OTHER') : 'OTHER';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    }

    return {
      totalAll: allDone.length,
      totalToday: todayDone.length,
      avgConfidence,
      typeDistribution,
      avgSpeed: `${(randomBetween(8, 25) / 10).toFixed(1)}`,
    };
  }, [documents, history]);

  const selectedDoc = useMemo(
    () => documents.find(d => d.id === selectedDocId) ?? null,
    [documents, selectedDocId],
  );

  // --- Upload simulation ---
  const processFiles = useCallback((files: FileList | File[]) => {
    const newDocs: ProcessedDocument[] = Array.from(files).map((file, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      uploadProgress: 0,
      status: 'uploading' as ProcessingStatus,
      thumbnailColor: THUMB_COLORS[randomBetween(0, THUMB_COLORS.length - 1)],
    }));

    setDocuments(prev => [...newDocs, ...prev]);

    // Simulate upload and processing for each
    for (const doc of newDocs) {
      // Upload progress
      let progress = 0;
      const uploadInterval = setInterval(() => {
        progress += randomBetween(15, 30);
        if (progress >= 100) {
          progress = 100;
          clearInterval(uploadInterval);
          setDocuments(prev => prev.map(d => d.id === doc.id
            ? { ...d, uploadProgress: 100, status: 'processing' }
            : d,
          ));

          // Processing delay
          const delay = randomBetween(1000, 2500);
          setTimeout(() => {
            const classification = simulateClassification();
            const fields = MOCK_EXTRACTIONS[classification.type]();
            setDocuments(prev => prev.map(d => d.id === doc.id
              ? {
                  ...d,
                  status: 'done',
                  detectedType: classification.type,
                  confidence: classification.confidence,
                  extractedFields: fields,
                  processedAt: new Date(),
                }
              : d,
            ));
          }, delay);
        } else {
          setDocuments(prev => prev.map(d => d.id === doc.id
            ? { ...d, uploadProgress: progress }
            : d,
          ));
        }
      }, 200);
    }

    if (newDocs.length > 0) {
      setSelectedDocId(newDocs[0].id);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  const handleOverrideType = useCallback((docId: string, newType: DocClassificationType) => {
    setDocuments(prev => prev.map(d => d.id === docId
      ? { ...d, detectedType: newType, extractedFields: MOCK_EXTRACTIONS[newType]() }
      : d,
    ));
  }, []);

  const handleAcceptField = useCallback((docId: string, fieldKey: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id !== docId) return d;
      return {
        ...d,
        extractedFields: d.extractedFields?.map(f =>
          f.key === fieldKey ? { ...f, accepted: true } : f,
        ),
      };
    }));
  }, []);

  const handleRemoveDoc = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    if (selectedDocId === docId) setSelectedDocId(null);
  }, [selectedDocId]);

  const handleReprocess = useCallback((docId: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id !== docId) return d;
      return { ...d, status: 'processing' as ProcessingStatus, detectedType: undefined, confidence: undefined, extractedFields: undefined };
    }));
    setTimeout(() => {
      const classification = simulateClassification();
      const fields = MOCK_EXTRACTIONS[classification.type]();
      setDocuments(prev => prev.map(d => d.id === docId
        ? { ...d, status: 'done', detectedType: classification.type, confidence: classification.confidence, extractedFields: fields, processedAt: new Date() }
        : d,
      ));
    }, randomBetween(1000, 2000));
  }, []);

  const filteredHistory = useMemo(() => {
    if (!historyTypeFilter) return history;
    return history.filter(h => h.detectedType === historyTypeFilter);
  }, [history, historyTypeFilter]);

  // Donut chart data
  const donutSegments = useMemo(() => {
    const entries = Object.entries(stats.typeDistribution).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (total === 0) return [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#ec4899', '#6366f1', '#14b8a6'];
    let offset = 0;
    return entries.map(([type, count], i) => {
      const pct = (count / total) * 100;
      const segment = { type, count, pct, color: colors[i % colors.length], offset };
      offset += pct;
      return segment;
    });
  }, [stats.typeDistribution]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('documents.recognition.title')}
        subtitle={t('documents.recognition.subtitle')}
        breadcrumbs={[
          { label: t('documents.recognition.breadcrumbHome'), href: '/' },
          { label: t('documents.recognition.breadcrumbDocuments'), href: '/documents' },
          { label: t('documents.recognition.breadcrumbRecognition') },
        ]}
      />

      {/* Upload Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-colors text-center cursor-pointer',
          isDragOver
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
            : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 hover:border-primary-300 dark:hover:border-primary-600',
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.bmp,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center',
            isDragOver
              ? 'bg-primary-100 dark:bg-primary-800/40'
              : 'bg-neutral-100 dark:bg-neutral-800',
          )}>
            <Upload size={28} className={cn(
              isDragOver
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-400 dark:text-neutral-500',
            )} />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t('documents.recognition.uploadTitle')}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              {t('documents.recognition.uploadHint')}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Sparkles size={14} className="text-primary-500" />
            <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              {t('documents.recognition.aiPowered')}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<FileText size={16} />}
          label={t('documents.recognition.statsTotal')}
          value={stats.totalAll}
          subtitle={t('documents.recognition.statsTodayCount', { count: String(stats.totalToday) })}
        />
        <MetricCard
          icon={<Sparkles size={16} />}
          label={t('documents.recognition.statsAvgConfidence')}
          value={`${stats.avgConfidence}%`}
          subtitle={stats.avgConfidence >= 85 ? t('documents.recognition.statsHighAccuracy') : t('documents.recognition.statsModerateAccuracy')}
        />
        <MetricCard
          icon={<Zap size={16} />}
          label={t('documents.recognition.statsSpeed')}
          value={`${stats.avgSpeed} ${t('documents.recognition.statsSec')}`}
          subtitle={t('documents.recognition.statsPerDoc')}
        />
        <MetricCard
          icon={<PieChart size={16} />}
          label={t('documents.recognition.statsTypes')}
          value={Object.keys(stats.typeDistribution).length}
          subtitle={t('documents.recognition.statsUniqueTypes')}
        />
      </div>

      {/* Donut Chart */}
      {donutSegments.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
            {t('documents.recognition.chartTitle')}
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative w-40 h-40 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {donutSegments.map((seg) => (
                  <circle
                    key={seg.type}
                    cx="18" cy="18" r="15.5"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="5"
                    strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                    strokeDashoffset={`${-seg.offset}`}
                    className="transition-all duration-500"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                  {stats.totalAll}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {donutSegments.map((seg) => (
                <div key={seg.type} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {getDocTypeLabel(seg.type as DocClassificationType)}
                  </span>
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                    {seg.count} ({seg.pct.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-neutral-200 dark:border-neutral-700">
        {(['batch', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
              'hover:text-neutral-700 dark:hover:text-neutral-300',
              activeTab === tab
                ? 'text-primary-600 dark:text-primary-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 dark:after:bg-primary-400 after:rounded-t'
                : 'text-neutral-500 dark:text-neutral-400',
            )}
          >
            {tab === 'batch'
              ? t('documents.recognition.tabBatch')
              : t('documents.recognition.tabHistory')}
            {tab === 'batch' && documents.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                {documents.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Batch Processing View */}
      {activeTab === 'batch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document list */}
          <div className="lg:col-span-2 space-y-3">
            {documents.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
                <Upload size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('documents.recognition.emptyBatch')}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                        <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('documents.recognition.colFile')}</th>
                        <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('documents.recognition.colDetectedType')}</th>
                        <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('documents.recognition.colConfidence')}</th>
                        <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('documents.recognition.colStatus')}</th>
                        <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const FileIcon = getFileIcon(doc.fileType);
                        return (
                          <tr
                            key={doc.id}
                            onClick={() => setSelectedDocId(doc.id)}
                            className={cn(
                              'border-b border-neutral-100 dark:border-neutral-800 cursor-pointer transition-colors',
                              selectedDocId === doc.id
                                ? 'bg-primary-50/50 dark:bg-primary-900/10'
                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={cn('w-8 h-8 rounded flex items-center justify-center flex-shrink-0', doc.thumbnailColor || 'bg-neutral-100 dark:bg-neutral-800')}>
                                  <FileIcon size={16} className="text-neutral-600 dark:text-neutral-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[200px]">{doc.fileName}</p>
                                  <p className="text-xs text-neutral-400">{formatFileSize(doc.fileSize)}</p>
                                </div>
                              </div>
                              {doc.status === 'uploading' && (
                                <div className="mt-1.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1">
                                  <div
                                    className="bg-primary-500 h-1 rounded-full transition-all"
                                    style={{ width: `${doc.uploadProgress}%` }}
                                  />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {doc.status === 'done' && doc.detectedType ? (
                                <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                  <select
                                    value={doc.detectedType}
                                    onChange={(e) => handleOverrideType(doc.id, e.target.value as DocClassificationType)}
                                    className="appearance-none text-xs font-medium bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 pr-6 text-neutral-700 dark:text-neutral-300 cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                                  >
                                    {DOC_TYPES.map(dt => (
                                      <option key={dt} value={dt}>{getDocTypeLabel(dt)}</option>
                                    ))}
                                  </select>
                                  <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                                </div>
                              ) : doc.status === 'processing' ? (
                                <span className="text-xs text-neutral-400 italic">{t('documents.recognition.analyzing')}</span>
                              ) : doc.status === 'uploading' ? (
                                <span className="text-xs text-neutral-400">{doc.uploadProgress}%</span>
                              ) : (
                                <span className="text-xs text-danger-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {doc.confidence != null ? (
                                <span className={cn('text-sm font-semibold', confidenceColor(doc.confidence))}>
                                  {doc.confidence}%
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={doc.status}
                                colorMap={statusColorMap}
                                label={getStatusLabel(doc.status)}
                                size="sm"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                {doc.status === 'done' && (
                                  <button
                                    onClick={() => handleReprocess(doc.id)}
                                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                    title={t('documents.recognition.reprocess')}
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveDoc(doc.id)}
                                  className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-danger-500 transition-colors"
                                  title={t('common.delete')}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Data Panel */}
          <div className="lg:col-span-1">
            {selectedDoc && selectedDoc.status === 'done' && selectedDoc.extractedFields ? (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden sticky top-4">
                {/* Preview header */}
                <div className={cn('p-4 flex items-center gap-3', selectedDoc.thumbnailColor || 'bg-neutral-100 dark:bg-neutral-800')}>
                  <div className="w-12 h-16 bg-white dark:bg-neutral-800 rounded shadow-sm flex items-center justify-center">
                    {React.createElement(getFileIcon(selectedDoc.fileType), { size: 24, className: 'text-neutral-400' })}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{selectedDoc.fileName}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {selectedDoc.detectedType && getDocTypeLabel(selectedDoc.detectedType)}
                      {selectedDoc.confidence != null && (
                        <span className={cn('ml-2 font-semibold', confidenceColor(selectedDoc.confidence))}>
                          {selectedDoc.confidence}%
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Fields */}
                <div className="p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {t('documents.recognition.extractedData')}
                  </h4>
                  {selectedDoc.extractedFields.map((field) => (
                    <div key={field.key} className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{field.label}</p>
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mt-0.5">{field.value}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className={cn('h-1 rounded-full flex-1 max-w-[60px]', confidenceBg(field.confidence))}>
                            <div
                              className={cn('h-1 rounded-full', field.confidence >= 90 ? 'bg-success-500' : field.confidence >= 70 ? 'bg-warning-500' : 'bg-danger-500')}
                              style={{ width: `${field.confidence}%` }}
                            />
                          </div>
                          <span className={cn('text-[10px] font-medium', confidenceColor(field.confidence))}>
                            {field.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 mt-1">
                        {field.accepted ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success-600 dark:text-success-400 font-medium">
                            <Check size={12} />
                            {t('documents.recognition.accepted')}
                          </span>
                        ) : (
                          <>
                            <button
                              onClick={() => handleAcceptField(selectedDoc.id, field.key)}
                              className="text-xs px-2 py-0.5 rounded bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 hover:bg-success-100 dark:hover:bg-success-900/30 transition-colors"
                            >
                              {t('documents.recognition.accept')}
                            </button>
                            <button
                              className="text-xs px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            >
                              {t('common.edit')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      iconLeft={<Check size={14} />}
                    >
                      {t('documents.recognition.saveToSystem')}
                    </Button>
                  </div>
                </div>
              </div>
            ) : selectedDoc && (selectedDoc.status === 'processing' || selectedDoc.status === 'uploading') ? (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {selectedDoc.status === 'uploading'
                    ? t('documents.recognition.uploadingFile')
                    : t('documents.recognition.analyzingFile')}
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
                <Eye size={32} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {t('documents.recognition.selectToPreview')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History View */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex flex-wrap items-center gap-3">
            <Filter size={14} className="text-neutral-400" />
            <div className="w-48">
              <Select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                placeholder={t('documents.recognition.allTypes')}
                options={[
                  { value: '', label: t('documents.recognition.allTypes') },
                  ...DOC_TYPES.map(dt => ({ value: dt, label: getDocTypeLabel(dt) })),
                ]}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('documents.recognition.colFile')}</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('documents.recognition.colDetectedType')}</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('documents.recognition.colConfidence')}</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('documents.recognition.colDate')}</th>
                  <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('documents.recognition.colStatus')}</th>
                  <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((entry) => (
                  <tr key={entry.id} className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-neutral-400 flex-shrink-0" />
                        <span className="text-neutral-800 dark:text-neutral-200">{entry.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                      {getDocTypeLabel(entry.detectedType)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('font-semibold', confidenceColor(entry.confidence))}>
                        {entry.confidence}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400 text-xs">
                      {formatDateTime(entry.processedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={entry.status}
                        colorMap={statusColorMap}
                        label={getStatusLabel(entry.status)}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                        title={t('documents.recognition.reprocess')}
                      >
                        <RotateCcw size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">
                      {t('documents.recognition.emptyHistory')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartDocRecognitionPage;
