import React, { useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, X, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { t } from '@/i18n';
import { adminApi } from '@/api/admin';
import toast from 'react-hot-toast';

interface ParsedUser {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password: string;
  valid: boolean;
  errors: string[];
}

function parseCsv(text: string): ParsedUser[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const sep = header.includes(';') ? ';' : ',';
  const cols = header.split(sep).map((c) => c.trim().replace(/^"/, '').replace(/"$/, ''));

  const emailIdx = cols.findIndex((c) => c === 'email' || c === 'e-mail' || c === 'почта');
  const firstNameIdx = cols.findIndex((c) => c === 'firstname' || c === 'first_name' || c === 'имя' || c === 'name');
  const lastNameIdx = cols.findIndex((c) => c === 'lastname' || c === 'last_name' || c === 'фамилия');
  const roleIdx = cols.findIndex((c) => c === 'role' || c === 'роль');
  const passwordIdx = cols.findIndex((c) => c === 'password' || c === 'пароль');

  return lines.slice(1).map((line) => {
    const values = line.split(sep).map((v) => v.trim().replace(/^"/, '').replace(/"$/, ''));
    const email = values[emailIdx] ?? '';
    const firstName = values[firstNameIdx] ?? '';
    const lastName = values[lastNameIdx] ?? '';
    const role = (values[roleIdx] ?? 'VIEWER').toUpperCase();
    const password = values[passwordIdx] ?? '';

    const errors: string[] = [];
    if (!email || !email.includes('@')) errors.push(t('admin.bulkImport.validationInvalidEmail'));
    if (!firstName) errors.push(t('admin.bulkImport.validationFirstNameRequired'));
    if (!lastName) errors.push(t('admin.bulkImport.validationLastNameRequired'));
    if (password && password.length < 6) errors.push(t('admin.bulkImport.validationPasswordTooShort'));
    if (!['ADMIN', 'MANAGER', 'ENGINEER', 'ACCOUNTANT', 'VIEWER'].includes(role)) errors.push(t('admin.bulkImport.validationUnknownRole', { role }));

    return { email, firstName, lastName, role, password: password || generatePassword(), valid: errors.length === 0, errors };
  });
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pwd = '';
  for (let i = 0; i < 12; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

const TEMPLATE_CSV = `email;firstName;lastName;role;password
ivanov@company.ru;Иван;Иванов;ENGINEER;
petrov@company.ru;Пётр;Петров;MANAGER;
sidorova@company.ru;Анна;Сидорова;ACCOUNTANT;`;

const BulkUserImportPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<ParsedUser[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const importMutation = useMutation({
    mutationFn: (data: { email: string; firstName: string; lastName: string; role: string; password: string }[]) =>
      adminApi.importUsers(data),
    onSuccess: (result) => {
      setImportResult(result);
      if (result.imported > 0) toast.success(t('admin.bulkImport.toastImported', { count: result.imported }));
      if (result.errors.length > 0) toast.error(t('admin.bulkImport.toastErrors', { count: result.errors.length }));
    },
    onError: () => toast.error(t('admin.users.toastImportError')),
  });

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsv(text);
      setUsers(parsed);
      setImportResult(null);
    };
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.txt'))) {
      handleFileSelect(file);
    } else {
      toast.error(t('admin.users.toastCsvOnly'));
    }
  }, [handleFileSelect]);

  const handleImport = () => {
    const validUsers = users.filter((u) => u.valid);
    if (validUsers.length === 0) {
      toast.error(t('admin.users.toastNoValidRecords'));
      return;
    }
    importMutation.mutate(validUsers.map(({ email, firstName, lastName, role, password }) => ({ email, firstName, lastName, role, password })));
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = users.filter((u) => u.valid).length;
  const errorCount = users.filter((u) => !u.valid).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t('admin.bulkImport.title')}
        subtitle={t('admin.bulkImport.subtitle')}
        breadcrumbs={[
          { label: t('navigation.items.dashboard'), href: '/' },
          { label: t('adminDashboard.title'), href: '/admin/dashboard' },
          { label: t('admin.bulkImport.breadcrumb') },
        ]}
        actions={
          <Button variant="secondary" iconLeft={<Download size={16} />} onClick={downloadTemplate}>
            {t('admin.bulkImport.downloadTemplate')}
          </Button>
        }
      />

      {/* Drop zone */}
      {users.length === 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="bg-white dark:bg-neutral-900 rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-600 p-12 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t('admin.bulkImport.dropZoneText')}
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            {t('admin.bulkImport.dropZoneHint')}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>
      )}

      {/* Preview */}
      {users.length > 0 && !importResult && (
        <>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{t('admin.bulkImport.records', { count: users.length })}</span>
              {validCount > 0 && (
                <span className="text-green-600">
                  <CheckCircle className="inline h-3.5 w-3.5 mr-0.5" />{t('admin.bulkImport.validCount', { count: validCount })}
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-red-600">
                  <AlertCircle className="inline h-3.5 w-3.5 mr-0.5" />{t('admin.bulkImport.errorCount', { count: errorCount })}
                </span>
              )}
            </div>
            <div className="flex-1" />
            <Button variant="secondary" onClick={() => setUsers([])}>{t('admin.bulkImport.resetBtn')}</Button>
            <Button onClick={handleImport} disabled={validCount === 0 || importMutation.isPending}>
              {importMutation.isPending ? t('admin.bulkImport.importing') : t('admin.bulkImport.importUsers', { count: validCount })}
            </Button>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                    <th className="text-left px-4 py-3 font-medium text-neutral-500 w-8">#</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-500">{t('admin.bulkImport.colEmail')}</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-500">{t('admin.bulkImport.colFirstName')}</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-500">{t('admin.bulkImport.colLastName')}</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-500">{t('admin.bulkImport.colRole')}</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-500">{t('admin.bulkImport.colStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {users.map((u, i) => (
                    <tr key={i} className={cn('hover:bg-neutral-50 dark:hover:bg-neutral-800/50', !u.valid && 'bg-red-50/50 dark:bg-red-900/5')}>
                      <td className="px-4 py-2.5 text-neutral-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{u.email}</td>
                      <td className="px-4 py-2.5">{u.firstName}</td>
                      <td className="px-4 py-2.5">{u.lastName}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-medium">{u.role}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {u.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                            <span className="text-[10px] text-red-600">{u.errors.join(', ')}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Result */}
      {importResult && (
        <div className="space-y-4">
          <div className={cn(
            'rounded-xl border p-6',
            importResult.errors.length === 0
              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800',
          )}>
            <div className="flex items-center gap-3 mb-3">
              {importResult.errors.length === 0 ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-600" />
              )}
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t('admin.bulkImport.importComplete')}
              </h3>
            </div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {t('admin.bulkImport.importedCount', { count: importResult.imported })}
            </p>
            {importResult.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">{t('admin.bulkImport.errorsLabel')}</p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>- {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Button variant="secondary" onClick={() => { setUsers([]); setImportResult(null); }}>
            {t('admin.bulkImport.uploadAnother')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BulkUserImportPage;
