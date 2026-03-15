import React, { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/cn';
import { apiClient } from '@/api/client';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MaterialImportWizardProps {
  projectId?: string;
  onComplete?: () => void;
}

interface ParsedRow {
  name: string;
  code: string;
  unitOfMeasure: string;
  category: string;
  minStockLevel: number;
  valid: boolean;
  error?: string;
}

interface ImportResult {
  totalReceived: number;
  successCount: number;
  errorCount: number;
  created: Array<{ id: string; name: string; code: string }>;
  errors: Array<{ rowIndex: number; name: string; error: string }>;
}

// Expected xlsx columns
const EXPECTED_COLUMNS = [
  'Наименование',
  'Артикул',
  'Единица измерения',
  'Категория',
  'Мин. остаток',
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function parseNum(val: unknown): number {
  if (val == null || val === '') return 0;
  const n = Number(String(val).replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function str(val: unknown): string {
  if (val == null) return '';
  return String(val).trim();
}

function parseXlsx(data: ArrayBuffer): ParsedRow[] {
  const wb = XLSX.read(data, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: Array<Record<string, unknown>> = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  return rows.map((row: Record<string, unknown>) => {
    // Try to match columns by known names
    const name =
      str(row['Наименование']) || str(row['Name']) || str(row['name']) || str(row['наименование']);
    const code =
      str(row['Артикул']) || str(row['Code']) || str(row['code']) || str(row['артикул']);
    const unit =
      str(row['Единица измерения']) || str(row['Unit']) || str(row['unit']) || str(row['ед.изм.']) || str(row['Ед. изм.']);
    const category =
      str(row['Категория']) || str(row['Category']) || str(row['category']) || str(row['категория']);
    const minStock =
      parseNum(row['Мин. остаток']) || parseNum(row['Min Stock']) || parseNum(row['minStock']);

    const errors: string[] = [];
    if (!name) errors.push('Нет наименования');
    if (!unit) errors.push('Нет единицы измерения');

    return {
      name,
      code,
      unitOfMeasure: unit,
      category,
      minStockLevel: minStock,
      valid: errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const MaterialImportWizard: React.FC<MaterialImportWizardProps> = ({ onComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setParseError(null);
    setParsing(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const rows = parseXlsx(data);
      if (rows.length === 0) {
        setParseError('Файл не содержит данных или столбцы не распознаны');
        setParsedRows([]);
      } else {
        setParsedRows(rows);
        setFileName(file.name);
      }
    } catch (e) {
      setParseError('Ошибка чтения файла: ' + (e instanceof Error ? e.message : String(e)));
      setParsedRows([]);
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const importMutation = useMutation({
    mutationFn: async (rows: ParsedRow[]) => {
      const validRows = rows.filter((r) => r.valid);
      const payload = {
        items: validRows.map((r) => ({
          name: r.name,
          code: r.code || null,
          unitOfMeasure: r.unitOfMeasure,
          category: r.category ? r.category.toUpperCase() : null,
          minStockLevel: r.minStockLevel > 0 ? r.minStockLevel : null,
          currentPrice: null,
        })),
      };
      const { data } = await apiClient.post('/api/warehouse/materials/bulk-import', payload);
      return data.data as ImportResult;
    },
    onSuccess: (result) => {
      setImportResult(result);
      if (onComplete) onComplete();
    },
  });

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.filter((r) => !r.valid).length;

  // ── Render: Import Result ──
  if (importResult) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="font-semibold text-green-800 dark:text-green-300">
              Импорт завершён
            </span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-400">
            Получено: {importResult.totalReceived}, Создано: {importResult.successCount},
            Ошибок: {importResult.errorCount}
          </p>
        </div>

        {importResult.errors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="font-medium text-red-800 dark:text-red-300 mb-2">Ошибки:</p>
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
              {importResult.errors.map((err, i) => (
                <li key={i}>
                  Строка {err.rowIndex + 1} ({err.name}): {err.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => {
            setParsedRows([]);
            setFileName('');
            setImportResult(null);
          }}
          className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-sm"
        >
          Импортировать ещё
        </button>
      </div>
    );
  }

  // ── Render: Preview Table ──
  if (parsedRows.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {fileName} — {parsedRows.length} строк
            </span>
          </div>
          <button
            onClick={() => {
              setParsedRows([]);
              setFileName('');
            }}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-green-600">Корректных: {validCount}</span>
          {invalidCount > 0 && <span className="text-red-600">С ошибками: {invalidCount}</span>}
        </div>

        <div className="overflow-auto max-h-80 border rounded-lg dark:border-neutral-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-neutral-800 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                  №
                </th>
                {EXPECTED_COLUMNS.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-neutral-700">
              {parsedRows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    !row.valid && 'bg-red-50 dark:bg-red-900/10',
                    'hover:bg-gray-50 dark:hover:bg-neutral-800/50',
                  )}
                >
                  <td className="px-3 py-1.5 text-gray-500">{i + 1}</td>
                  <td className="px-3 py-1.5">{row.name || '—'}</td>
                  <td className="px-3 py-1.5">{row.code || '—'}</td>
                  <td className="px-3 py-1.5">{row.unitOfMeasure || '—'}</td>
                  <td className="px-3 py-1.5">{row.category || '—'}</td>
                  <td className="px-3 py-1.5">{row.minStockLevel || '—'}</td>
                  <td className="px-3 py-1.5">
                    {row.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-xs text-red-600">{row.error}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button
            disabled={validCount === 0 || importMutation.isPending}
            onClick={() => importMutation.mutate(parsedRows)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium text-white',
              'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {importMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Импорт...
              </span>
            ) : (
              `Импортировать ${validCount} материалов`
            )}
          </button>
          <button
            onClick={() => {
              setParsedRows([]);
              setFileName('');
            }}
            className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          >
            Отмена
          </button>
        </div>

        {importMutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400">
              Ошибка импорта:{' '}
              {importMutation.error instanceof Error
                ? importMutation.error.message
                : 'Неизвестная ошибка'}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Upload Zone ──
  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-8',
          'border-2 border-dashed rounded-xl cursor-pointer transition-colors',
          'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50',
          'dark:border-neutral-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10',
        )}
      >
        {parsing ? (
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        ) : (
          <Upload className="h-10 w-10 text-gray-400 dark:text-neutral-500" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {parsing ? 'Обработка файла...' : 'Перетащите xlsx файл сюда или нажмите для выбора'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ожидаемые столбцы: {EXPECTED_COLUMNS.join(', ')}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {parseError && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{parseError}</span>
        </div>
      )}
    </div>
  );
};

export default MaterialImportWizard;
