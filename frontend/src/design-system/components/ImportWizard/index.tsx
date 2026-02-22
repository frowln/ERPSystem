import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { Select } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ImportField {
  key: string;
  label: string;
  required?: boolean;
  validate?: (value: string) => string | null;
}

export interface ImportWizardProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: Record<string, string>[]) => Promise<void>;
  fields: ImportField[];
  title?: string;
  maxRows?: number;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface ParsedFile {
  name: string;
  size: number;
  headers: string[];
  rows: string[][];
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string; // '' means unmapped
}

interface RowValidationError {
  rowIndex: number;
  fieldKey: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Auto-detect column mapping by case-insensitive substring match.
 * For each source header, find the first target field whose label or key
 * contains the header (or vice-versa).
 */
function autoMapColumns(headers: string[], fields: ImportField[]): ColumnMapping[] {
  const usedTargets = new Set<string>();

  return headers.map((header) => {
    const headerLower = header.toLowerCase().trim();

    for (const field of fields) {
      if (usedTargets.has(field.key)) continue;

      const labelLower = field.label.toLowerCase();
      const keyLower = field.key.toLowerCase();

      if (
        headerLower.includes(keyLower) ||
        keyLower.includes(headerLower) ||
        headerLower.includes(labelLower) ||
        labelLower.includes(headerLower)
      ) {
        usedTargets.add(field.key);
        return { sourceColumn: header, targetField: field.key };
      }
    }

    return { sourceColumn: header, targetField: '' };
  });
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

const StepIndicator: React.FC<{ steps: string[]; current: number }> = ({ steps, current }) => (
  <div className="flex items-center gap-2 mb-6 flex-wrap">
    {steps.map((label, i) => (
      <div key={label} className="flex items-center gap-2">
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
            i <= current
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400',
          )}
        >
          {i + 1}
        </div>
        <span
          className={cn(
            'text-sm',
            i <= current
              ? 'text-neutral-900 dark:text-neutral-100 font-medium'
              : 'text-neutral-400 dark:text-neutral-500',
          )}
        >
          {label}
        </span>
        {i < steps.length - 1 && (
          <div className="w-8 h-px bg-neutral-300 dark:bg-neutral-600" />
        )}
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Step 1: File Upload
// ---------------------------------------------------------------------------

interface StepUploadProps {
  parsedFile: ParsedFile | null;
  onFileSelected: (file: File) => void;
  parsing: boolean;
  parseError: string | null;
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}

const StepUpload: React.FC<StepUploadProps> = ({
  parsedFile,
  onFileSelected,
  parsing,
  parseError,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          dragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-400 dark:hover:border-primary-500',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload
          size={32}
          className={cn(
            'mx-auto mb-3',
            dragOver
              ? 'text-primary-500'
              : 'text-neutral-400 dark:text-neutral-500',
          )}
        />
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {t('importWizard.dragHint')}
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          CSV, XLSX, XLS
        </p>
      </div>

      {parsing && (
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          {t('importWizard.parsing')}
        </div>
      )}

      {parseError && (
        <div className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-950/30 rounded-lg px-3 py-2">
          <XCircle size={16} className="shrink-0" />
          {parseError}
        </div>
      )}

      {parsedFile && !parsing && (
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg px-4 py-3 space-y-1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-primary-600 dark:text-primary-400 shrink-0" />
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {parsedFile.name}
            </span>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex gap-4">
            <span>{t('importWizard.fileSize')}: {formatBytes(parsedFile.size)}</span>
            <span>{t('importWizard.rowCount')}: {parsedFile.rows.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 2: Column Mapping
// ---------------------------------------------------------------------------

interface StepMappingProps {
  mappings: ColumnMapping[];
  fields: ImportField[];
  onUpdateMapping: (index: number, targetField: string) => void;
  unmappedRequired: ImportField[];
}

const StepMapping: React.FC<StepMappingProps> = ({
  mappings,
  fields,
  onUpdateMapping,
  unmappedRequired,
}) => {
  const targetOptions = useMemo(
    () => [
      { value: '', label: `-- ${t('importWizard.skipColumn')} --` },
      ...fields.map((f) => ({
        value: f.key,
        label: f.required ? `${f.label} *` : f.label,
      })),
    ],
    [fields],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-0 items-center">
        {/* Header row */}
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide pb-2">
          {t('importWizard.sourceColumn')}
        </span>
        <span />
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide pb-2">
          {t('importWizard.targetField')}
        </span>

        {mappings.map((mapping, idx) => (
          <React.Fragment key={idx}>
            <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {mapping.sourceColumn}
            </div>
            <span className="text-neutral-400 dark:text-neutral-500 text-center px-1">
              &rarr;
            </span>
            <Select
              options={targetOptions}
              value={mapping.targetField}
              onChange={(e) => onUpdateMapping(idx, e.target.value)}
            />
          </React.Fragment>
        ))}
      </div>

      {unmappedRequired.length > 0 && (
        <div className="flex items-start gap-2 text-sm text-warning-700 dark:text-warning-400 bg-warning-50 dark:bg-warning-950/30 rounded-lg px-3 py-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>
            {t('importWizard.unmappedWarning')}:{' '}
            {unmappedRequired.map((f) => f.label).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 3: Data Preview
// ---------------------------------------------------------------------------

interface StepPreviewProps {
  previewRows: Record<string, string>[];
  fields: ImportField[];
  mappings: ColumnMapping[];
  validationErrors: RowValidationError[];
  totalRows: number;
}

const StepPreview: React.FC<StepPreviewProps> = ({
  previewRows,
  fields,
  mappings,
  validationErrors,
  totalRows,
}) => {
  const mappedFields = useMemo(
    () => fields.filter((f) => mappings.some((m) => m.targetField === f.key)),
    [fields, mappings],
  );

  const errorCount = validationErrors.length;
  const errorsByCell = useMemo(() => {
    const map = new Map<string, string>();
    for (const err of validationErrors) {
      map.set(`${err.rowIndex}:${err.fieldKey}`, err.message);
    }
    return map;
  }, [validationErrors]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-neutral-600 dark:text-neutral-400">
          {t('importWizard.previewTitle', { shown: Math.min(5, previewRows.length), total: totalRows })}
        </span>
        <span
          className={cn(
            'font-medium',
            errorCount > 0
              ? 'text-danger-600 dark:text-danger-400'
              : 'text-success-600 dark:text-success-400',
          )}
        >
          {t('importWizard.errorCount', { count: errorCount })}
        </span>
      </div>

      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <th className="text-left px-3 py-2 font-medium text-neutral-600 dark:text-neutral-400 text-xs w-10">
                #
              </th>
              {mappedFields.map((f) => (
                <th
                  key={f.key}
                  className="text-left px-3 py-2 font-medium text-neutral-600 dark:text-neutral-400 text-xs"
                >
                  {f.label}
                  {f.required && <span className="text-danger-500 ml-0.5">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.slice(0, 5).map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0"
              >
                <td className="px-3 py-2 text-xs text-neutral-400 dark:text-neutral-500">
                  {rowIdx + 1}
                </td>
                {mappedFields.map((f) => {
                  const cellError = errorsByCell.get(`${rowIdx}:${f.key}`);
                  return (
                    <td
                      key={f.key}
                      className={cn(
                        'px-3 py-2 text-neutral-900 dark:text-neutral-100',
                        cellError && 'bg-danger-50 dark:bg-danger-950/30',
                      )}
                      title={cellError ?? undefined}
                    >
                      <span className="block truncate max-w-[200px]">
                        {row[f.key] || (
                          <span className="text-neutral-300 dark:text-neutral-600 italic">
                            &mdash;
                          </span>
                        )}
                      </span>
                      {cellError && (
                        <span className="block text-xs text-danger-600 dark:text-danger-400 mt-0.5">
                          {cellError}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 4: Confirmation
// ---------------------------------------------------------------------------

interface StepConfirmProps {
  totalRows: number;
  errorCount: number;
  warningCount: number;
  mappedFieldCount: number;
  totalFieldCount: number;
}

const StepConfirm: React.FC<StepConfirmProps> = ({
  totalRows,
  errorCount,
  warningCount,
  mappedFieldCount,
  totalFieldCount,
}) => (
  <div className="space-y-4">
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-3">
        {errorCount === 0 ? (
          <CheckCircle2 size={24} className="text-success-600 dark:text-success-400 shrink-0" />
        ) : (
          <AlertTriangle size={24} className="text-warning-600 dark:text-warning-400 shrink-0" />
        )}
        <div>
          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t('importWizard.confirmSummary', { rows: totalRows })}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('importWizard.confirmMapped', { mapped: mappedFieldCount, total: totalFieldCount })}
          </p>
        </div>
      </div>

      {errorCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400">
          <XCircle size={16} className="shrink-0" />
          {t('importWizard.errorCount', { count: errorCount })}
        </div>
      )}

      {warningCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-warning-600 dark:text-warning-400">
          <AlertTriangle size={16} className="shrink-0" />
          {t('importWizard.warningCount', { count: warningCount })}
        </div>
      )}
    </div>

    {errorCount > 0 && (
      <div className="bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 rounded-lg p-3">
        <p className="text-sm text-warning-800 dark:text-warning-300">
          {t('importWizard.confirmErrorHint')}
        </p>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ImportWizard: React.FC<ImportWizardProps> = ({
  open,
  onClose,
  onImport,
  fields,
  title,
  maxRows,
}) => {
  // State
  const [step, setStep] = useState(0);
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Steps
  const steps = useMemo(
    () => [
      t('importWizard.stepUpload'),
      t('importWizard.stepMapping'),
      t('importWizard.stepPreview'),
      t('importWizard.stepConfirm'),
    ],
    [],
  );

  // Reset everything
  const resetState = useCallback(() => {
    setStep(0);
    setParsedFile(null);
    setMappings([]);
    setParsing(false);
    setParseError(null);
    setSubmitting(false);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // File parsing
  const parseFile = useCallback(
    async (file: File) => {
      setParsing(true);
      setParseError(null);
      setParsedFile(null);

      try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setParseError(t('importWizard.parseErrorEmpty'));
          setParsing(false);
          return;
        }

        const sheet = workbook.Sheets[sheetName];
        if (!sheet) {
          setParseError(t('importWizard.parseErrorEmpty'));
          setParsing(false);
          return;
        }

        const jsonData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length < 2) {
          setParseError(t('importWizard.parseErrorNoData'));
          setParsing(false);
          return;
        }

        const rawHeaders = (jsonData[0] ?? []) as unknown[];
        const headers = rawHeaders.map((h: unknown) => String(h ?? '').trim()).filter(Boolean);
        const rawDataRows = jsonData.slice(1) as unknown[][];
        const dataRows = rawDataRows.filter((row: unknown[]) =>
          row.some((cell: unknown) => cell !== null && cell !== undefined && String(cell).trim() !== ''),
        );

        if (maxRows && dataRows.length > maxRows) {
          setParseError(t('importWizard.parseErrorTooMany', { max: maxRows }));
          setParsing(false);
          return;
        }

        // Normalize all cell values to strings
        const normalizedRows = dataRows.map((row: unknown[]) =>
          headers.map((_: string, colIdx: number) => {
            const val = row[colIdx];
            return val === null || val === undefined ? '' : String(val).trim();
          }),
        );

        const parsed: ParsedFile = {
          name: file.name,
          size: file.size,
          headers,
          rows: normalizedRows,
        };

        setParsedFile(parsed);
        setMappings(autoMapColumns(headers, fields));
      } catch {
        setParseError(t('importWizard.parseErrorGeneric'));
      } finally {
        setParsing(false);
      }
    },
    [fields, maxRows],
  );

  const handleFileSelected = useCallback(
    (file: File) => {
      void parseFile(file);
    },
    [parseFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
          void parseFile(file);
        }
      }
    },
    [parseFile],
  );

  // Mapping helpers
  const updateMapping = useCallback((index: number, targetField: string) => {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, targetField } : m)),
    );
  }, []);

  const unmappedRequired = useMemo(
    () =>
      fields.filter(
        (f) => f.required && !mappings.some((m) => m.targetField === f.key),
      ),
    [fields, mappings],
  );

  // Build mapped rows
  const mappedRows = useMemo(() => {
    if (!parsedFile) return [];

    return parsedFile.rows.map((row) => {
      const mapped: Record<string, string> = {};
      mappings.forEach((m, colIdx) => {
        if (m.targetField) {
          mapped[m.targetField] = row[colIdx] ?? '';
        }
      });
      return mapped;
    });
  }, [parsedFile, mappings]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: RowValidationError[] = [];

    mappedRows.forEach((row, rowIdx) => {
      // Check required fields
      for (const field of fields) {
        if (!mappings.some((m) => m.targetField === field.key)) continue;

        if (field.required && (!row[field.key] || row[field.key].trim() === '')) {
          errors.push({
            rowIndex: rowIdx,
            fieldKey: field.key,
            message: t('importWizard.validationRequired'),
          });
          continue;
        }

        if (field.validate && row[field.key]) {
          const errorMsg = field.validate(row[field.key]);
          if (errorMsg) {
            errors.push({
              rowIndex: rowIdx,
              fieldKey: field.key,
              message: errorMsg,
            });
          }
        }
      }
    });

    return errors;
  }, [mappedRows, fields, mappings]);

  const warningCount = unmappedRequired.length;

  // Navigation
  const canNext =
    step === 0
      ? parsedFile !== null && !parsing
      : step === 1
        ? mappings.some((m) => m.targetField !== '')
        : true;

  const handleImport = useCallback(async () => {
    setSubmitting(true);
    try {
      await onImport(mappedRows);
    } finally {
      setSubmitting(false);
      handleClose();
    }
  }, [onImport, mappedRows, handleClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title ?? t('importWizard.defaultTitle')}
      size="xl"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={step === 0 ? handleClose : () => setStep(step - 1)}
            disabled={submitting}
          >
            {step === 0 ? t('common.cancel') : t('common.back')}
          </Button>
          {step < steps.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('common.next')}
            </Button>
          ) : (
            <Button onClick={handleImport} loading={submitting}>
              {submitting ? t('importWizard.importing') : t('importWizard.importBtn')}
            </Button>
          )}
        </>
      }
    >
      <StepIndicator steps={steps} current={step} />

      {step === 0 && (
        <StepUpload
          parsedFile={parsedFile}
          onFileSelected={handleFileSelected}
          parsing={parsing}
          parseError={parseError}
          dragOver={dragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
      )}

      {step === 1 && (
        <StepMapping
          mappings={mappings}
          fields={fields}
          onUpdateMapping={updateMapping}
          unmappedRequired={unmappedRequired}
        />
      )}

      {step === 2 && (
        <StepPreview
          previewRows={mappedRows}
          fields={fields}
          mappings={mappings}
          validationErrors={validationErrors}
          totalRows={mappedRows.length}
        />
      )}

      {step === 3 && (
        <StepConfirm
          totalRows={mappedRows.length}
          errorCount={validationErrors.length}
          warningCount={warningCount}
          mappedFieldCount={mappings.filter((m) => m.targetField !== '').length}
          totalFieldCount={fields.length}
        />
      )}
    </Modal>
  );
};

export default ImportWizard;
