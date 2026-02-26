import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  ShieldX,
  FileSignature,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
} from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { Select } from '@/design-system/components/FormField';
import { StatusBadge } from '@/design-system/components/StatusBadge';
import { kepApi } from './api';
import { t } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import toast from 'react-hot-toast';
import type { KepSignature, KepCertificate } from './types';
import type { PaginatedResponse } from '@/types';

const tp = (k: string, params?: Record<string, string | number>) => t(`kep.widget.${k}`, params);

interface KepSigningWidgetProps {
  /** The document ID to check signatures for */
  documentId: string;
  /** The document type / model name (e.g. 'contract', 'invoice', 'ks2') */
  documentType: string;
  /** Optional compact mode for smaller contexts */
  compact?: boolean;
}

export default function KepSigningWidget({
  documentId,
  documentType,
  compact = false,
}: KepSigningWidgetProps) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState('');

  // Query existing signatures for this document
  const { data: signatures = [], isLoading } = useQuery<KepSignature[]>({
    queryKey: ['kep-signatures', documentType, documentId],
    queryFn: () => kepApi.getDocumentSignatures(documentType, documentId),
    enabled: !!documentId && !!documentType,
  });

  // Query active certificates for signing
  const { data: certData } = useQuery<PaginatedResponse<KepCertificate>>({
    queryKey: ['kep-certificates-for-widget'],
    queryFn: () => kepApi.getCertificates(),
    enabled: showSignModal,
  });

  const activeCertificates = certData?.content?.filter((c) => c.status === 'ACTIVE') ?? [];

  const signMutation = useMutation({
    mutationFn: (certificateId: string) =>
      kepApi.signDocument({ certificateId, documentModel: documentType, documentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kep-signatures', documentType, documentId] });
      setShowSignModal(false);
      setSelectedCertificateId('');
      toast.success(tp('signSuccess'));
    },
    onError: () => toast.error(tp('signError')),
  });

  const isSigned = signatures.length > 0;
  const allValid = signatures.every((s) => s.isValid);

  const certOptions = [
    { value: '', label: tp('selectCertificate') },
    ...activeCertificates.map((c) => ({
      value: c.id,
      label: `${c.ownerName} (${c.serialNumber.substring(0, 12)}...)`,
    })),
  ];

  if (isLoading) {
    return (
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-3">
        <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
          <span>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2">
          {isSigned ? (
            <>
              {allValid ? (
                <ShieldCheck size={16} className="text-green-500" />
              ) : (
                <ShieldX size={16} className="text-red-500" />
              )}
              <span className="text-xs text-neutral-600 dark:text-neutral-400">
                {tp('signedCount', { count: String(signatures.length) })}
              </span>
            </>
          ) : (
            <>
              <ShieldX size={16} className="text-neutral-400 dark:text-neutral-500" />
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {tp('notSigned')}
              </span>
            </>
          )}
          <Button
            variant="ghost"
            size="xs"
            iconLeft={<FileSignature size={12} />}
            onClick={() => setShowSignModal(true)}
          >
            {tp('signButton')}
          </Button>
        </div>

        <Modal
          open={showSignModal}
          onClose={() => {
            setShowSignModal(false);
            setSelectedCertificateId('');
          }}
          title={tp('signTitle')}
        >
          <SignModalContent
            certOptions={certOptions}
            selectedCertificateId={selectedCertificateId}
            onCertChange={setSelectedCertificateId}
            onSign={() => signMutation.mutate(selectedCertificateId)}
            onCancel={() => {
              setShowSignModal(false);
              setSelectedCertificateId('');
            }}
            isPending={signMutation.isPending}
          />
        </Modal>
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            {isSigned ? (
              allValid ? (
                <ShieldCheck size={18} className="text-green-500" />
              ) : (
                <ShieldX size={18} className="text-red-500" />
              )
            ) : (
              <ShieldX size={18} className="text-neutral-400 dark:text-neutral-500" />
            )}
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {tp('title')}
            </h4>
            {isSigned && (
              <StatusBadge
                status={allValid ? 'valid' : 'invalid'}
                colorMap={{ valid: 'green', invalid: 'red' }}
                label={allValid ? tp('statusValid') : tp('statusInvalid')}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="xs"
              iconLeft={<FileSignature size={12} />}
              onClick={() => setShowSignModal(true)}
            >
              {tp('signButton')}
            </Button>
            {signatures.length > 0 && (
              <button
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 py-3">
          {isSigned ? (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">
                {tp('signedCount', { count: String(signatures.length) })}
              </span>
              <span className="text-neutral-400">|</span>
              <span className="text-neutral-600 dark:text-neutral-400">
                {tp('lastSignedBy')}: {signatures[signatures.length - 1]?.certificateOwner ?? '---'}
              </span>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {tp('noSignatures')}
            </p>
          )}
        </div>

        {/* Expanded signature list */}
        {expanded && signatures.length > 0 && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 divide-y divide-neutral-100 dark:divide-neutral-800">
            {signatures.map((sig) => (
              <div key={sig.id} className="px-4 py-3 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {sig.isValid ? (
                    <ShieldCheck size={16} className="text-green-500" />
                  ) : (
                    <ShieldX size={16} className="text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {sig.certificateOwner}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={12} className="text-neutral-400" />
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDateTime(sig.signedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 font-mono mt-1 truncate">
                    ID: {sig.id}
                  </p>
                </div>
                <StatusBadge
                  status={sig.isValid ? 'valid' : 'invalid'}
                  colorMap={{ valid: 'green', invalid: 'red' }}
                  label={sig.isValid ? tp('statusValid') : tp('statusInvalid')}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign modal */}
      <Modal
        open={showSignModal}
        onClose={() => {
          setShowSignModal(false);
          setSelectedCertificateId('');
        }}
        title={tp('signTitle')}
      >
        <SignModalContent
          certOptions={certOptions}
          selectedCertificateId={selectedCertificateId}
          onCertChange={setSelectedCertificateId}
          onSign={() => signMutation.mutate(selectedCertificateId)}
          onCancel={() => {
            setShowSignModal(false);
            setSelectedCertificateId('');
          }}
          isPending={signMutation.isPending}
        />
      </Modal>
    </>
  );
}

function SignModalContent({
  certOptions,
  selectedCertificateId,
  onCertChange,
  onSign,
  onCancel,
  isPending,
}: {
  certOptions: { value: string; label: string }[];
  selectedCertificateId: string;
  onCertChange: (id: string) => void;
  onSign: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {tp('signDescription')}
      </p>
      <Select
        options={certOptions}
        value={selectedCertificateId}
        onChange={(e) => onCertChange(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={onSign}
          disabled={!selectedCertificateId || isPending}
          loading={isPending}
          iconLeft={<FileSignature size={14} />}
        >
          {tp('signConfirm')}
        </Button>
      </div>
    </div>
  );
}
