import React, { useState, useCallback, useMemo } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { parseInvoiceFile, type ParsedInvoice } from '../lib/invoiceParser';
import { batchMatch, type InvoiceLine } from '../lib/fuzzyMatcher';
import type { SpecItem } from '@/types';

interface InvoiceImportWizardProps {
  open: boolean;
  onClose: () => void;
  specItems: SpecItem[];
  onImport: (entries: { specItemId: string; vendorName: string; unitPrice: number; quantity: number }[]) => void;
  isPending: boolean;
}

type Step = 1 | 2 | 3 | 4;

interface FileEntry {
  file: File;
  vendorName: string;
}

export const InvoiceImportWizard: React.FC<InvoiceImportWizardProps> = ({
  open,
  onClose,
  specItems,
  onImport,
  isPending,
}) => {
  const [step, setStep] = useState<Step>(1);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [parsedInvoices, setParsedInvoices] = useState<ParsedInvoice[]>([]);
  const [matchResults, setMatchResults] = useState<MatchedLine[]>([]);

  const reset = useCallback(() => {
    setStep(1);
    setFiles([]);
    setParsedInvoices([]);
    setMatchResults([]);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  // --- Step 1: File upload ---
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(f =>
      /\.(xlsx|xls|csv)$/i.test(f.name)
    );
    setFiles(prev => [...prev, ...dropped.map(f => ({ file: f, vendorName: '' }))]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected.map(f => ({ file: f, vendorName: '' }))]);
    e.target.value = '';
  }, []);

  // --- Step 2: Parse & preview ---
  const parseFiles = useCallback(async () => {
    const results: ParsedInvoice[] = [];
    for (const { file, vendorName } of files) {
      const buffer = await file.arrayBuffer();
      results.push(parseInvoiceFile(buffer, vendorName || file.name.replace(/\.[^.]+$/, '')));
    }
    setParsedInvoices(results);
    setStep(2);
  }, [files]);

  // --- Step 3: Fuzzy match ---
  const runMatching = useCallback(() => {
    const allMatched: MatchedLine[] = [];
    for (const inv of parsedInvoices) {
      const matches = batchMatch(inv.lines, specItems);
      for (const m of matches) {
        allMatched.push({
          vendorName: inv.vendorName,
          line: m.line,
          matchedItemId: m.bestMatch?.specItem.id ?? null,
          matchedItemName: m.bestMatch?.specItem.name ?? null,
          confidence: m.bestMatch?.confidence ?? 0,
          unitPrice: m.line.unitPrice ?? 0,
          quantity: m.line.quantity ?? 0,
        });
      }
    }
    setMatchResults(allMatched);
    setStep(3);
  }, [parsedInvoices, specItems]);

  // --- Step 4: Confirm ---
  const importableCount = useMemo(
    () => matchResults.filter(m => m.matchedItemId).length,
    [matchResults],
  );

  const handleImport = useCallback(() => {
    const entries = matchResults
      .filter(m => m.matchedItemId)
      .map(m => ({
        specItemId: m.matchedItemId!,
        vendorName: m.vendorName,
        unitPrice: m.unitPrice,
        quantity: m.quantity,
      }));
    onImport(entries);
  }, [matchResults, onImport]);

  const canProceed = step === 1
    ? files.length > 0 && files.every(f => f.vendorName.trim().length > 0)
    : true;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t('competitiveList.matrix.importTitle')}
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-neutral-500">
            {t('competitiveList.matrix.importStep', { step, total: 4 })}
          </div>
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="secondary" size="sm" iconLeft={<ArrowLeft size={14} />}
                onClick={() => setStep((step - 1) as Step)}>
                {t('common.back')}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            {step === 1 && (
              <Button variant="primary" size="sm" disabled={!canProceed} onClick={parseFiles}
                iconRight={<ArrowRight size={14} />}>
                {t('common.next')}
              </Button>
            )}
            {step === 2 && (
              <Button variant="primary" size="sm" onClick={runMatching}
                iconRight={<ArrowRight size={14} />}>
                {t('common.next')}
              </Button>
            )}
            {step === 3 && (
              <Button variant="primary" size="sm" onClick={() => setStep(4)}
                iconRight={<ArrowRight size={14} />}>
                {t('common.next')}
              </Button>
            )}
            {step === 4 && (
              <Button variant="primary" size="sm" loading={isPending} onClick={handleImport}>
                {t('competitiveList.matrix.importBtn')}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {step === 1 && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <Upload size={32} className="mx-auto mb-2 text-neutral-400" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('competitiveList.matrix.importDropzone')}
            </p>
            <p className="text-xs text-neutral-400 mt-1">.xlsx, .xls, .csv</p>
            <label className="mt-3 inline-block cursor-pointer">
              <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                {t('competitiveList.matrix.importBrowse')}
              </span>
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv" multiple onChange={handleFileSelect} />
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded border border-neutral-200 dark:border-neutral-700">
                  <FileSpreadsheet size={16} className="text-green-600 flex-shrink-0" />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 flex-1 truncate">{f.file.name}</span>
                  <Input
                    value={f.vendorName}
                    onChange={(e) => {
                      setFiles(prev => prev.map((p, j) => j === i ? { ...p, vendorName: e.target.value } : p));
                    }}
                    placeholder={t('competitiveList.matrix.importVendorName')}
                    className="w-48 h-7 text-sm"
                  />
                  <button
                    onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 max-h-[400px] overflow-auto">
          {parsedInvoices.map((inv, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                {inv.vendorName} — {inv.lines.length} {t('competitiveList.matrix.importLines')}
              </h4>
              {inv.errors.length > 0 && (
                <div className="text-xs text-red-500 mb-2">{inv.errors.join(', ')}</div>
              )}
              <table className="w-full text-xs border border-neutral-200 dark:border-neutral-700 rounded">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-800">
                    <th className="px-2 py-1 text-left">{t('competitiveList.matrix.colPosition')}</th>
                    <th className="px-2 py-1 text-center">{t('competitiveList.matrix.colQty')}</th>
                    <th className="px-2 py-1 text-right">{t('competitiveList.entry.price')}</th>
                    <th className="px-2 py-1 text-right">{t('competitiveList.entry.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.lines.slice(0, 20).map((line, j) => (
                    <tr key={j} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-2 py-1 truncate max-w-[200px]">{line.name}</td>
                      <td className="px-2 py-1 text-center">{line.quantity ?? '—'} {line.unit ?? ''}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{line.unitPrice?.toFixed(2) ?? '—'}</td>
                      <td className="px-2 py-1 text-right tabular-nums">{line.totalPrice?.toFixed(2) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inv.lines.length > 20 && (
                <p className="text-xs text-neutral-400 mt-1">
                  ... {t('competitiveList.matrix.importMore', { count: inv.lines.length - 20 })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2 max-h-[400px] overflow-auto">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
            {t('competitiveList.matrix.matchDescription')}
          </p>
          <table className="w-full text-xs border border-neutral-200 dark:border-neutral-700 rounded">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800">
                <th className="px-2 py-1 text-left">{t('competitiveList.matrix.matchInvoiceLine')}</th>
                <th className="px-2 py-1 text-left">{t('competitiveList.matrix.matchSpecItem')}</th>
                <th className="px-2 py-1 text-center w-16">{t('competitiveList.matrix.matchConfidence')}</th>
              </tr>
            </thead>
            <tbody>
              {matchResults.map((m, i) => (
                <tr key={i} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="px-2 py-1.5">
                    <span className="text-neutral-700 dark:text-neutral-300 truncate block max-w-[200px]">
                      {m.line.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">{m.vendorName}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    {m.matchedItemName ? (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={m.matchedItemId ?? ''}
                          onChange={(e) => {
                            const newId = e.target.value;
                            const newItem = specItems.find(si => si.id === newId);
                            setMatchResults(prev =>
                              prev.map((p, j) => j === i
                                ? { ...p, matchedItemId: newId || null, matchedItemName: newItem?.name ?? null }
                                : p
                              )
                            );
                          }}
                          className="text-xs border border-neutral-300 dark:border-neutral-600 rounded px-1 py-0.5 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 max-w-[200px]"
                        >
                          <option value="">—</option>
                          {specItems.map(si => (
                            <option key={si.id} value={si.id}>{si.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <select
                        value=""
                        onChange={(e) => {
                          const newId = e.target.value;
                          const newItem = specItems.find(si => si.id === newId);
                          setMatchResults(prev =>
                            prev.map((p, j) => j === i
                              ? { ...p, matchedItemId: newId || null, matchedItemName: newItem?.name ?? null }
                              : p
                            )
                          );
                        }}
                        className="text-xs border border-neutral-300 dark:border-neutral-600 rounded px-1 py-0.5 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 max-w-[200px]"
                      >
                        <option value="">{t('competitiveList.matrix.matchNotFound')}</option>
                        {specItems.map(si => (
                          <option key={si.id} value={si.id}>{si.name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <ConfidenceBadge value={m.confidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 text-center py-4">
          <CheckCircle2 size={40} className="mx-auto text-green-500" />
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            {t('competitiveList.matrix.importConfirm', { count: importableCount })}
          </p>
          {matchResults.length - importableCount > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle size={12} className="inline mr-1" />
              {t('competitiveList.matrix.importSkipped', { count: matchResults.length - importableCount })}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MatchedLine {
  vendorName: string;
  line: InvoiceLine;
  matchedItemId: string | null;
  matchedItemName: string | null;
  confidence: number;
  unitPrice: number;
  quantity: number;
}

const ConfidenceBadge: React.FC<{ value: number }> = ({ value }) => {
  const color = value >= 80 ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
    : value >= 50 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400'
    : 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';

  return (
    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', color)}>
      {value}%
    </span>
  );
};
