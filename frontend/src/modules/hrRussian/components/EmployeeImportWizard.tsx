import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Columns3,
  Eye,
  Rocket,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { apiClient } from '@/api/client';
import {
  ImportTemplateDownload,
  EMPLOYEE_TEMPLATE_COLUMNS,
} from '@/components/ImportTemplateDownload';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type WizardStep = 'upload' | 'mapping' | 'preview' | 'import';

const STEPS: WizardStep[] = ['upload', 'mapping', 'preview', 'import'];

const STEP_LABELS: Record<WizardStep, string> = {
  upload: 'Загрузка файла',
  mapping: 'Сопоставление колонок',
  preview: 'Предпросмотр',
  import: 'Импорт',
};

const STEP_ICONS: Record<WizardStep, React.FC<{ className?: string }>> = {
  upload: Upload,
  mapping: Columns3,
  preview: Eye,
  import: Rocket,
};

interface EmployeeRow {
  lastName: string;
  firstName: string;
  middleName: string;
  position: string;
  department: string;
  personnelNumber: string;
  inn: string;
  snils: string;
  email: string;
  phone: string;
}

interface RowValidation {
  row: EmployeeRow;
  rowIndex: number;
  errors: string[];
  valid: boolean;
}

interface BulkImportResult {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  errors: string[];
}

const FIELD_LABELS: Record<keyof EmployeeRow, string> = {
  lastName: 'Фамилия',
  firstName: 'Имя',
  middleName: 'Отчество',
  position: 'Должность',
  department: 'Подразделение',
  personnelNumber: 'Табельный номер',
  inn: 'ИНН',
  snils: 'СНИЛС',
  email: 'Email',
  phone: 'Телефон',
};

const REQUIRED_FIELDS: (keyof EmployeeRow)[] = ['lastName', 'firstName', 'position'];

const HEADER_PATTERNS: Record<keyof EmployeeRow, RegExp> = {
  lastName: /фамил|last\s*name|surname/i,
  firstName: /^имя$|first\s*name|^name$/i,
  middleName: /отчеств|middle\s*name|patrony/i,
  position: /должност|position|job\s*title/i,
  department: /подразделен|отдел|department/i,
  personnelNumber: /табельн|номер|personnel|emp.*num/i,
  inn: /^инн$|^inn$/i,
  snils: /снилс|snils/i,
  email: /email|почт|e-mail/i,
  phone: /телефон|phone|моб/i,
};

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────

function validateInn(inn: string): boolean {
  if (!inn) return true; // Optional
  const clean = inn.replace(/\D/g, '');
  return clean.length === 10 || clean.length === 12;
}

function validateSnils(snils: string): boolean {
  if (!snils) return true; // Optional
  const clean = snils.replace(/\D/g, '');
  return clean.length === 11;
}

function validateRow(row: EmployeeRow, index: number): RowValidation {
  const errors: string[] = [];

  if (!row.lastName.trim()) errors.push('Фамилия обязательна');
  if (!row.firstName.trim()) errors.push('Имя обязательно');
  if (!row.position.trim()) errors.push('Должность обязательна');
  if (row.inn && !validateInn(row.inn)) errors.push('Неверный формат ИНН (10 или 12 цифр)');
  if (row.snils && !validateSnils(row.snils)) errors.push('Неверный формат СНИЛС (11 цифр)');
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Неверный формат Email');

  return { row, rowIndex: index, errors, valid: errors.length === 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const EmployeeImportWizard: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Raw parsed data
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);

  // Column mapping: field key -> column index
  const [mapping, setMapping] = useState<Record<keyof EmployeeRow, number | null>>({
    lastName: null,
    firstName: null,
    middleName: null,
    position: null,
    department: null,
    personnelNumber: null,
    inn: null,
    snils: null,
    email: null,
    phone: null,
  });

  // Validated rows
  const [validatedRows, setValidatedRows] = useState<RowValidation[]>([]);

  // Import result
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  // ── Step navigation ──────────────────────────────────────────────────────

  const currentStepIndex = STEPS.indexOf(step);

  const goNext = () => {
    const next = STEPS[currentStepIndex + 1];
    if (next) {
      if (next === 'preview') {
        // Build validated rows
        const rows = buildEmployeeRows();
        const validated = rows.map((r, i) => validateRow(r, i));
        setValidatedRows(validated);
      }
      setStep(next);
    }
  };

  const goBack = () => {
    const prev = STEPS[currentStepIndex - 1];
    if (prev) setStep(prev);
  };

  // ── File parsing ─────────────────────────────────────────────────────────

  const parseFile = useCallback((file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      toast.error('Поддерживаются только файлы .xlsx / .xls');
      return;
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = (
          XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
            raw: false,
          }) as unknown[][]
        ).map((r) => r.map((c) => String(c ?? '').replace(/\r/g, '').trim()));

        if (rows.length < 2) {
          toast.error('Файл пуст или содержит только заголовки');
          return;
        }

        const headers = rows[0];
        const dataRows = rows.slice(1).filter((r) => r.some((c) => c.length > 0));

        setRawHeaders(headers);
        setRawRows(dataRows);

        // Auto-detect column mapping
        const autoMapping = { ...mapping };
        const allFields = Object.keys(HEADER_PATTERNS) as (keyof EmployeeRow)[];
        for (const field of allFields) {
          const pattern = HEADER_PATTERNS[field];
          const idx = headers.findIndex((h) => pattern.test(h));
          if (idx >= 0) autoMapping[field] = idx;
        }
        setMapping(autoMapping);

        toast.success(`Загружено ${dataRows.length} строк из "${file.name}"`);
        setStep('mapping');
      } catch {
        toast.error('Ошибка чтения файла');
      }
    };
    reader.onerror = () => toast.error('Ошибка чтения файла');
    reader.readAsArrayBuffer(file);
  }, [mapping]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = '';
  };

  // ── Build employee rows from mapping ──────────────────────────────────────

  const buildEmployeeRows = useCallback((): EmployeeRow[] => {
    return rawRows.map((row) => ({
      lastName: mapping.lastName != null ? (row[mapping.lastName] ?? '') : '',
      firstName: mapping.firstName != null ? (row[mapping.firstName] ?? '') : '',
      middleName: mapping.middleName != null ? (row[mapping.middleName] ?? '') : '',
      position: mapping.position != null ? (row[mapping.position] ?? '') : '',
      department: mapping.department != null ? (row[mapping.department] ?? '') : '',
      personnelNumber: mapping.personnelNumber != null ? (row[mapping.personnelNumber] ?? '') : '',
      inn: mapping.inn != null ? (row[mapping.inn] ?? '') : '',
      snils: mapping.snils != null ? (row[mapping.snils] ?? '') : '',
      email: mapping.email != null ? (row[mapping.email] ?? '') : '',
      phone: mapping.phone != null ? (row[mapping.phone] ?? '') : '',
    }));
  }, [rawRows, mapping]);

  // ── Import mutation ───────────────────────────────────────────────────────

  const importMutation = useMutation({
    mutationFn: async () => {
      const validRows = validatedRows.filter((v) => v.valid).map((v) => v.row);
      const response = await apiClient.post<BulkImportResult>(
        '/employees/bulk-import',
        validRows,
      );
      return response.data;
    },
    onSuccess: (result) => {
      setImportResult(result);
      toast.success(`Импортировано: ${result.created} из ${result.total}`);
    },
    onError: () => {
      toast.error('Ошибка при импорте сотрудников');
    },
  });

  const handleImport = () => {
    importMutation.mutate();
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const validCount = validatedRows.filter((v) => v.valid).length;
  const errorCount = validatedRows.filter((v) => !v.valid).length;

  const canProceedMapping = useMemo(() => {
    return REQUIRED_FIELDS.every((f) => mapping[f] != null);
  }, [mapping]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Импорт сотрудников"
        subtitle="Загрузка списка сотрудников из xlsx-файла"
        backTo="/hr/employees"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('hr.breadcrumbPersonnel'), href: '/employees' },
          { label: 'Импорт' },
        ]}
      />

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = STEP_ICONS[s];
          const isCurrent = s === step;
          const isPast = i < currentStepIndex;
          return (
            <React.Fragment key={s}>
              {i > 0 && (
                <div className={cn('h-px flex-1 min-w-4', isPast ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-600')} />
              )}
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shrink-0 transition-colors',
                  isCurrent && 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
                  isPast && 'text-primary-600 dark:text-primary-400',
                  !isCurrent && !isPast && 'text-neutral-500 dark:text-neutral-400',
                )}
              >
                {isPast ? (
                  <CheckCircle2 className="w-4 h-4 text-primary-500" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{STEP_LABELS[s]}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step 1: Upload ── */}
      {step === 'upload' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Загрузите xlsx-файл со списком сотрудников
            </h3>
            <ImportTemplateDownload
              templateName="Сотрудники"
              columns={EMPLOYEE_TEMPLATE_COLUMNS}
              fileName="shablon_sotrudnikov"
            />
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
              isDragOver
                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-neutral-300 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-neutral-400" />
            <p className="text-base font-medium text-neutral-700 dark:text-neutral-300">
              Перетащите файл или нажмите для выбора
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Поддерживается .xlsx и .xls
            </p>
          </div>

          {fileName && (
            <div className="mt-4 flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
              <FileSpreadsheet className="w-4 h-4" />
              {fileName} ({rawRows.length} строк)
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Column Mapping ── */}
      {step === 'mapping' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            Сопоставление колонок
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
            Укажите, какая колонка файла соответствует каждому полю. Обязательные поля отмечены *.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(FIELD_LABELS) as (keyof EmployeeRow)[]).map((field) => {
              const isRequired = REQUIRED_FIELDS.includes(field);
              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {FIELD_LABELS[field]}{isRequired && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <select
                    value={mapping[field] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMapping((prev) => ({
                        ...prev,
                        [field]: val === '' ? null : Number(val),
                      }));
                    }}
                    className={cn(
                      'w-full h-9 px-3 text-sm border rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
                      isRequired && mapping[field] == null
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-neutral-300 dark:border-neutral-600',
                    )}
                  >
                    <option value="">-- Не выбрано --</option>
                    {rawHeaders.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Колонка ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Preview first row */}
          {rawRows.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2 uppercase tracking-wide">
                Пример данных (1-я строка)
              </h4>
              <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-neutral-50 dark:bg-neutral-800">
                      {rawHeaders.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                          {h || `Col ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {rawRows[0]?.map((cell, i) => (
                        <td key={i} className="px-3 py-2 text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                          {cell || '—'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Preview & Validate ── */}
      {step === 'preview' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Предпросмотр и валидация
            </h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600 dark:text-green-400 font-medium">
                {validCount} корректных
              </span>
              {errorCount > 0 && (
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {errorCount} с ошибками
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700 max-h-[50vh] overflow-y-auto">
            <table className="text-xs w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-neutral-50 dark:bg-neutral-800">
                  <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">#</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">Фамилия</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">Имя</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">Отчество</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">Должность</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">ИНН</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-600 dark:text-neutral-400">Статус</th>
                </tr>
              </thead>
              <tbody>
                {validatedRows.map((v, i) => (
                  <tr
                    key={i}
                    className={cn(
                      'border-t border-neutral-100 dark:border-neutral-700',
                      !v.valid && 'bg-red-50 dark:bg-red-900/10',
                    )}
                  >
                    <td className="px-3 py-2 tabular-nums text-neutral-400">{i + 1}</td>
                    <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200">{v.row.lastName || '—'}</td>
                    <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200">{v.row.firstName || '—'}</td>
                    <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200">{v.row.middleName || '—'}</td>
                    <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200">{v.row.position || '—'}</td>
                    <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200 font-mono">{v.row.inn || '—'}</td>
                    <td className="px-3 py-2 text-neutral-800 dark:text-neutral-200">{v.row.email || '—'}</td>
                    <td className="px-3 py-2">
                      {v.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 dark:text-red-400" title={v.errors.join('; ')}>
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {v.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {errorCount > 0 && (
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Строки с ошибками ({errorCount}) будут пропущены при импорте.
                Будут импортированы только {validCount} корректных записей.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Import ── */}
      {step === 'import' && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          {!importResult && !importMutation.isPending && (
            <div className="text-center py-8">
              <Rocket className="w-12 h-12 mx-auto mb-4 text-primary-500" />
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Готово к импорту
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Будет импортировано {validCount} сотрудников
                {errorCount > 0 && ` (пропущено ${errorCount} с ошибками)`}
              </p>
              <Button onClick={handleImport} iconLeft={<Upload size={16} />}>
                Начать импорт
              </Button>
            </div>
          )}

          {importMutation.isPending && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary-500 animate-spin" />
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Импорт выполняется...
              </p>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Импорт завершён
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Обработано {importResult.total} записей
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 text-center">
                  <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {importResult.total}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Всего</div>
                </div>
                <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 text-center">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400 tabular-nums">
                    {importResult.created}
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-500 mt-1">Создано</div>
                </div>
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                    {importResult.skipped}
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-500 mt-1">Пропущено</div>
                </div>
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-center">
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400 tabular-nums">
                    {importResult.failed}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-500 mt-1">Ошибки</div>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                    Ошибки при импорте:
                  </h4>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-xs text-red-600 dark:text-red-400">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={() => navigate('/employees')}>
                  К списку сотрудников
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep('upload');
                    setRawHeaders([]);
                    setRawRows([]);
                    setValidatedRows([]);
                    setImportResult(null);
                    setFileName(null);
                  }}
                >
                  Импортировать ещё
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Navigation buttons ── */}
      {!importResult && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="secondary"
            onClick={goBack}
            disabled={currentStepIndex === 0}
            iconLeft={<ArrowLeft size={14} />}
          >
            {'Назад'}
          </Button>
          {step !== 'import' && (
            <Button
              onClick={goNext}
              disabled={
                (step === 'upload' && rawRows.length === 0) ||
                (step === 'mapping' && !canProceedMapping)
              }
              iconRight={<ArrowRight size={14} />}
            >
              {'Далее'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeImportWizard;
