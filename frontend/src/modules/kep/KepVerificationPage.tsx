import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Upload,
  ShieldCheck,
  ShieldX,
  FileText,
  Clock,
  User,
  Key,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input } from '@/design-system/components/FormField';
import { kepApi } from './api';
import { t } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import toast from 'react-hot-toast';
import type { KepSignature } from './types';

const tp = (k: string) => t(`kep.verification.${k}`);

interface VerificationResult {
  valid: boolean;
  details: string;
  signature?: KepSignature;
}

export default function KepVerificationPage() {
  const [signatureId, setSignatureId] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const verifyMutation = useMutation<VerificationResult, Error, string>({
    mutationFn: async (sigId: string) => {
      const result = await kepApi.verifySignature(sigId);
      return result as VerificationResult;
    },
    onError: () => toast.error(tp('verifyError')),
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setDroppedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDroppedFile(e.target.files[0]);
    }
  }, []);

  const handleVerify = useCallback(() => {
    if (signatureId.trim()) {
      verifyMutation.mutate(signatureId.trim());
    }
  }, [signatureId, verifyMutation]);

  const handleReset = useCallback(() => {
    setSignatureId('');
    setDroppedFile(null);
    verifyMutation.reset();
  }, [verifyMutation]);

  const result = verifyMutation.data;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={tp('title')}
        subtitle={tp('subtitle')}
        breadcrumbs={[
          { label: tp('breadcrumbHome'), href: '/' },
          { label: tp('breadcrumbKep'), href: '/settings/kep/certificates' },
          { label: tp('breadcrumbVerification') },
        ]}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Drag and drop zone */}
        <div
          className={`relative rounded-xl border-2 border-dashed transition-colors p-8 text-center ${
            dragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload
            size={40}
            className={`mx-auto mb-3 ${
              dragActive
                ? 'text-primary-500'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            {tp('dropzoneTitle')}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            {tp('dropzoneDescription')}
          </p>
          <label className="inline-flex cursor-pointer">
            <span className="inline-flex items-center h-8 px-3 text-sm gap-1.5 rounded-md bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-xs">
              {tp('browseFiles')}
            </span>
            <input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".sig,.sgn,.p7s,.xml"
              onChange={handleFileInput}
            />
          </label>
          {droppedFile && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <FileText size={16} className="text-primary-500" />
              <span>{droppedFile.name}</span>
              <span className="text-neutral-400">
                ({(droppedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
        </div>

        {/* Signature ID input */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {tp('verifyByIdTitle')}
          </h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <FormField label={tp('fieldSignatureId')}>
                <Input
                  value={signatureId}
                  onChange={(e) => setSignatureId(e.target.value)}
                  placeholder={tp('signatureIdPlaceholder')}
                  className="font-mono"
                />
              </FormField>
            </div>
            <Button
              onClick={handleVerify}
              disabled={!signatureId.trim() || verifyMutation.isPending}
              loading={verifyMutation.isPending}
              iconLeft={<ShieldCheck size={14} />}
            >
              {tp('verifyButton')}
            </Button>
          </div>
        </div>

        {/* Verification result */}
        {result && (
          <div
            className={`rounded-xl border-2 p-6 ${
              result.valid
                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 rounded-full p-3 ${
                  result.valid
                    ? 'bg-green-100 dark:bg-green-800/40'
                    : 'bg-red-100 dark:bg-red-800/40'
                }`}
              >
                {result.valid ? (
                  <ShieldCheck size={32} className="text-green-600 dark:text-green-400" />
                ) : (
                  <ShieldX size={32} className="text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <h3
                  className={`text-lg font-semibold ${
                    result.valid
                      ? 'text-green-800 dark:text-green-200'
                      : 'text-red-800 dark:text-red-200'
                  }`}
                >
                  {result.valid ? tp('resultValid') : tp('resultInvalid')}
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    result.valid
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {result.details}
                </p>

                {/* Signature details */}
                {result.signature && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <DetailRow
                      icon={<User size={14} />}
                      label={tp('detailSigner')}
                      value={result.signature.certificateOwner}
                    />
                    <DetailRow
                      icon={<Clock size={14} />}
                      label={tp('detailTimestamp')}
                      value={formatDateTime(result.signature.signedAt)}
                    />
                    <DetailRow
                      icon={<Key size={14} />}
                      label={tp('detailCertificateId')}
                      value={result.signature.certificateId}
                      mono
                    />
                    <DetailRow
                      icon={<ShieldCheck size={14} />}
                      label={tp('detailValidity')}
                      value={
                        result.signature.isValid
                          ? tp('signatureValid')
                          : tp('signatureInvalid')
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={handleReset}>
                {tp('verifyAnother')}
              </Button>
            </div>
          </div>
        )}

        {/* Error state */}
        {verifyMutation.isError && !result && (
          <div className="rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 p-6">
            <div className="flex items-center gap-3">
              <ShieldX size={24} className="text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
                  {tp('verifyErrorTitle')}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {tp('verifyErrorDescription')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-neutral-400 dark:text-neutral-500 mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
        <p
          className={`text-sm text-neutral-900 dark:text-neutral-100 ${
            mono ? 'font-mono text-xs' : ''
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
