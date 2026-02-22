import React, { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Camera,
  Upload,
  AlertTriangle,
  Shield,
  BarChart3,
  Cloud,
  Wrench,
  FileText,
  ClipboardList,
  BookOpen,
  ImageIcon,
} from 'lucide-react';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import { aiApi } from '@/api/ai';
import type { PhotoAnalysisResult, PhotoFinding } from '@/api/ai';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { Skeleton } from '@/design-system/components/Skeleton';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const findingTypeIcon: Record<PhotoFinding['type'], React.ReactNode> = {
  SAFETY_VIOLATION: <Shield size={16} className="text-danger-500" />,
  DEFECT: <AlertTriangle size={16} className="text-warning-500" />,
  PROGRESS: <BarChart3 size={16} className="text-primary-500" />,
  WEATHER: <Cloud size={16} className="text-cyan-500" />,
  EQUIPMENT: <Wrench size={16} className="text-neutral-500" />,
};

const severityColorMap: Record<string, string> = {
  CRITICAL: 'red',
  HIGH: 'orange',
  MEDIUM: 'yellow',
  LOW: 'green',
};

const getRiskColor = (score: number): string => {
  if (score >= 80) return 'text-success-600';
  if (score >= 50) return 'text-warning-600';
  return 'text-danger-600';
};

// ---------------------------------------------------------------------------
// Drop Zone
// ---------------------------------------------------------------------------

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled],
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
      if (inputRef.current) inputRef.current.value = '';
    },
    [onFileSelect],
  );

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
        isDragOver
          ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
          : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-600',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={t('ai.photoAnalysis.dropZoneTitle')}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-3">
        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center',
          isDragOver
            ? 'bg-primary-100 dark:bg-primary-800'
            : 'bg-neutral-100 dark:bg-neutral-800',
        )}>
          {isDragOver ? (
            <Upload size={24} className="text-primary-600" />
          ) : (
            <Camera size={24} className="text-neutral-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {isDragOver ? t('ai.photoAnalysis.dropZoneDragActive') : t('ai.photoAnalysis.dropZoneTitle')}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {t('ai.photoAnalysis.dropZoneDescription')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Finding Card
// ---------------------------------------------------------------------------

const FindingCard: React.FC<{ finding: PhotoFinding }> = ({ finding }) => (
  <div className="flex items-start gap-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
    <div className="mt-0.5 flex-shrink-0">{findingTypeIcon[finding.type]}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {t(`ai.photoAnalysis.findingType.${finding.type}`)}
        </span>
        <StatusBadge
          status={finding.severity}
          colorMap={severityColorMap}
          label={t(`ai.photoAnalysis.severity.${finding.severity}`)}
          size="sm"
        />
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{finding.description}</p>
      <div className="flex items-center gap-4 mt-2">
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('ai.photoAnalysis.confidence')}: {Math.round(finding.confidence * 100)}%
        </span>
        {finding.suggestedAction && (
          <span className="text-xs text-primary-600 dark:text-primary-400">
            {t('ai.photoAnalysis.suggestedAction')}: {finding.suggestedAction}
          </span>
        )}
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Analysis Results Panel
// ---------------------------------------------------------------------------

const AnalysisResultsPanel: React.FC<{ result: PhotoAnalysisResult }> = ({ result }) => {
  const safetyFindings = result.findings.filter((f) => f.type === 'SAFETY_VIOLATION');
  const defectFindings = result.findings.filter((f) => f.type === 'DEFECT');
  const otherFindings = result.findings.filter(
    (f) => f.type !== 'SAFETY_VIOLATION' && f.type !== 'DEFECT',
  );

  return (
    <div className="space-y-6">
      {/* Overview metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t('ai.photoAnalysis.safetyScore')}
          </p>
          <p className={cn('text-2xl font-semibold mt-1', getRiskColor(result.safetyScore))}>
            {result.safetyScore}%
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t('ai.photoAnalysis.progressEstimate')}
          </p>
          <p className="text-2xl font-semibold text-primary-600 mt-1">{result.progressEstimate}%</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            {t('ai.photoAnalysis.findingsCount')}
          </p>
          <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
            {result.findings.length}
          </p>
        </div>
      </div>

      {/* Overall assessment */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('ai.photoAnalysis.overallAssessment')}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{result.overallAssessment}</p>
      </div>

      {/* Safety violations */}
      {safetyFindings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <Shield size={16} className="text-danger-500" />
            {t('ai.photoAnalysis.findingType.SAFETY_VIOLATION')} ({safetyFindings.length})
          </h3>
          <div className="space-y-2">
            {safetyFindings.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}

      {/* Defects */}
      {defectFindings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-warning-500" />
            {t('ai.photoAnalysis.findingType.DEFECT')} ({defectFindings.length})
          </h3>
          <div className="space-y-2">
            {defectFindings.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}

      {/* Other findings */}
      {otherFindings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            {t('ai.photoAnalysis.analysisResults')} ({otherFindings.length})
          </h3>
          <div className="space-y-2">
            {otherFindings.map((f) => (
              <FindingCard key={f.id} finding={f} />
            ))}
          </div>
        </div>
      )}

      {result.findings.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('ai.photoAnalysis.noFindings')}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          iconLeft={<FileText size={14} />}
          onClick={() => toast.success(t('ai.photoAnalysis.actions.createDefect'))}
        >
          {t('ai.photoAnalysis.actions.createDefect')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconLeft={<ClipboardList size={14} />}
          onClick={() => toast.success(t('ai.photoAnalysis.actions.createIncident'))}
        >
          {t('ai.photoAnalysis.actions.createIncident')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconLeft={<BookOpen size={14} />}
          onClick={() => toast.success(t('ai.photoAnalysis.actions.addToDailyLog'))}
        >
          {t('ai.photoAnalysis.actions.addToDailyLog')}
        </Button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// History Table
// ---------------------------------------------------------------------------

const HistoryTable: React.FC<{ analyses: PhotoAnalysisResult[]; loading: boolean }> = ({
  analyses,
  loading,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8">
        <ImageIcon size={32} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {t('ai.photoAnalysis.history.noHistory')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 dark:border-neutral-700">
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.photoAnalysis.history.date')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.photoAnalysis.history.photo')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.photoAnalysis.history.findings')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.photoAnalysis.safetyScore')}
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('ai.photoAnalysis.history.status')}
            </th>
          </tr>
        </thead>
        <tbody>
          {analyses.map((a) => (
            <tr
              key={a.id}
              className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <td className="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                {new Date(a.analyzedAt).toLocaleDateString('ru-RU')}
              </td>
              <td className="py-3 px-4">
                {a.photoUrl ? (
                  <img
                    src={a.photoUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <ImageIcon size={16} className="text-neutral-400" />
                  </div>
                )}
              </td>
              <td className="py-3 px-4 text-neutral-900 dark:text-neutral-100 font-medium">
                {a.findings.length}
              </td>
              <td className="py-3 px-4">
                <span className={cn('font-medium', getRiskColor(a.safetyScore))}>
                  {a.safetyScore}%
                </span>
              </td>
              <td className="py-3 px-4">
                <StatusBadge
                  status="COMPLETED"
                  colorMap={{ COMPLETED: 'green' }}
                  label={t('ai.photoAnalysis.history.statusCompleted')}
                  size="sm"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

const AiPhotoAnalysisPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: analyses = [], isLoading: historyLoading } = useQuery({
    queryKey: ['ai', 'photo-analyses'],
    queryFn: aiApi.getPhotoAnalyses,
  });

  const analyzeMutation = useMutation({
    mutationFn: (file: File) => aiApi.analyzePhoto(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'photo-analyses'] });
    },
    onError: () => {
      toast.error(t('common.error'));
    },
  });

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    // Reset any previous analysis
    analyzeMutation.reset();
  }, [analyzeMutation]);

  const handleAnalyze = useCallback(() => {
    if (selectedFile) {
      analyzeMutation.mutate(selectedFile);
    }
  }, [selectedFile, analyzeMutation]);

  return (
    <div>
      <PageHeader
        title={t('ai.photoAnalysis.title')}
        subtitle={t('ai.photoAnalysis.subtitle')}
        breadcrumbs={[
          { label: t('ai.photoAnalysis.breadcrumbAi'), href: '/ai-assistant' },
          { label: t('ai.photoAnalysis.breadcrumbPhotoAnalysis') },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Upload + Preview */}
        <div className="space-y-4">
          <DropZone onFileSelect={handleFileSelect} disabled={analyzeMutation.isPending} />

          {/* Preview */}
          {previewUrl && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
              <img
                src={previewUrl}
                alt=""
                className="w-full rounded-lg object-contain max-h-80"
              />
              <div className="flex justify-end mt-3">
                <Button
                  onClick={handleAnalyze}
                  loading={analyzeMutation.isPending}
                  iconLeft={<Camera size={16} />}
                >
                  {analyzeMutation.isPending
                    ? t('ai.photoAnalysis.analyzing')
                    : t('ai.photoAnalysis.analyze')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Results */}
        <div>
          {analyzeMutation.isPending && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {analyzeMutation.data && !analyzeMutation.isPending && (
            <AnalysisResultsPanel result={analyzeMutation.data} />
          )}
          {!analyzeMutation.data && !analyzeMutation.isPending && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 text-center">
              <Camera size={40} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {t('ai.photoAnalysis.dropZoneTitle')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      <div className="mt-8">
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('ai.photoAnalysis.history.title')}
            </h2>
          </div>
          <HistoryTable analyses={analyses} loading={historyLoading} />
        </div>
      </div>
    </div>
  );
};

export default AiPhotoAnalysisPage;
