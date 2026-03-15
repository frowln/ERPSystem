import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Building2,
  Award,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/cn';
import { t } from '@/i18n';
import { formatDate } from '@/lib/format';
import { sroApi, type SroVerificationResult } from '@/api/sro';
import { Button } from '@/design-system/components/Button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);

const fmtDate = (iso: string): string => formatDate(iso);

const getCompetencyLabel = (level: number | string): string => {
  const lvl = String(level);
  if (lvl === '1') return t('procurement.prequalification.sro.level1');
  if (lvl === '2') return t('procurement.prequalification.sro.level2');
  if (lvl === '3') return t('procurement.prequalification.sro.level3');
  if (lvl === '4') return t('procurement.prequalification.sro.level4');
  if (lvl === '5') return t('procurement.prequalification.sro.level5');
  return lvl;
};

const statusStyles: Record<SroVerificationResult['status'], {
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}> = {
  ACTIVE: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    icon: <ShieldCheck size={20} />,
    label: 'procurement.prequalification.sro.active',
  },
  SUSPENDED: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    icon: <ShieldX size={20} />,
    label: 'procurement.prequalification.sro.suspended',
  },
  EXCLUDED: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    icon: <ShieldX size={20} />,
    label: 'procurement.prequalification.sro.excluded',
  },
  NOT_FOUND: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <AlertTriangle size={20} />,
    label: 'procurement.prequalification.sro.notFound',
  },
};

// ---------------------------------------------------------------------------
// InfoRow
// ---------------------------------------------------------------------------

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-2.5 py-1.5">
    <span className="text-neutral-400 dark:text-neutral-500 mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0">
      <dt className="text-xs text-neutral-500 dark:text-neutral-400">{label}</dt>
      <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5 break-words">
        {value || '\u2014'}
      </dd>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SroVerificationCardProps {
  inn: string;
  /** Compact mode for inline use in forms */
  compact?: boolean;
  /** Callback when verification completes */
  onVerified?: (result: SroVerificationResult) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SroVerificationCard: React.FC<SroVerificationCardProps> = ({
  inn,
  compact = false,
  onVerified,
  className,
}) => {
  const [result, setResult] = useState<SroVerificationResult | null>(null);

  const verifyMutation = useMutation({
    mutationFn: () => sroApi.verifySro(inn),
    onSuccess: (data) => {
      setResult(data);
      onVerified?.(data);
    },
    onError: () => {
      toast.error(t('procurement.prequalification.sro.error'));
    },
  });

  const handleVerify = () => {
    if (!inn || inn.trim().length === 0) return;
    verifyMutation.mutate();
  };

  // --- Not yet verified ---
  if (!result) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700',
          compact ? 'p-4' : 'p-6',
          className,
        )}
      >
        <h3
          className={cn(
            'font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2',
            compact ? 'text-sm mb-3' : 'text-base mb-4',
          )}
        >
          <Shield size={compact ? 16 : 18} className="text-neutral-400" />
          {t('procurement.prequalification.sro.title')}
        </h3>

        <Button
          variant="outline"
          size={compact ? 'sm' : 'md'}
          iconLeft={
            verifyMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Shield size={16} />
            )
          }
          onClick={handleVerify}
          disabled={verifyMutation.isPending || !inn?.trim()}
        >
          {verifyMutation.isPending
            ? t('procurement.prequalification.sro.verifying')
            : t('procurement.prequalification.sro.verify')}
        </Button>
      </div>
    );
  }

  // --- Not a member ---
  if (!result.isMember) {
    return (
      <div
        className={cn(
          'rounded-xl border',
          'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          compact ? 'p-4' : 'p-6',
          className,
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <ShieldX size={24} className="text-red-600 dark:text-red-400 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">
              {t('procurement.prequalification.sro.notMember')}
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              {t('procurement.prequalification.sro.warning')}
            </p>
          </div>
        </div>

        {/* Re-verify button */}
        <Button
          variant="outline"
          size="sm"
          iconLeft={<Shield size={14} />}
          onClick={handleVerify}
          disabled={verifyMutation.isPending}
          className="mt-2"
        >
          {verifyMutation.isPending
            ? t('procurement.prequalification.sro.verifying')
            : t('procurement.prequalification.sro.verify')}
        </Button>
      </div>
    );
  }

  // --- Verified member ---
  const style = statusStyles[result.status] ?? statusStyles.NOT_FOUND;

  return (
    <div
      className={cn(
        'rounded-xl border overflow-hidden',
        'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700',
        className,
      )}
    >
      {/* Status header */}
      <div className={cn('px-4 py-3 flex items-center gap-2.5', style.bg, style.border, 'border-b')}>
        <span className={style.text}>{style.icon}</span>
        <div className="flex-1 min-w-0">
          <span className={cn('text-sm font-semibold', style.text)}>
            {t(style.label)}
          </span>
        </div>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            style.bg,
            style.text,
            'border',
            style.border,
          )}
        >
          {t('procurement.prequalification.sro.member')}
        </span>
      </div>

      {/* Body */}
      <div className={compact ? 'p-4 space-y-1' : 'p-5 space-y-1'}>
        <InfoRow
          icon={<Building2 size={15} />}
          label={t('procurement.prequalification.sro.sroName')}
          value={result.sroName}
        />
        <InfoRow
          icon={<Award size={15} />}
          label={t('procurement.prequalification.sro.certificateNumber')}
          value={result.certificateNumber}
        />
        <InfoRow
          icon={<Clock size={15} />}
          label={t('procurement.prequalification.sro.memberSince')}
          value={result.memberSince ? fmtDate(result.memberSince) : undefined}
        />
        <InfoRow
          icon={<Shield size={15} />}
          label={t('procurement.prequalification.sro.competencyLevel')}
          value={getCompetencyLabel(result.competencyLevel)}
        />
        <InfoRow
          icon={<Tag size={15} />}
          label={t('procurement.prequalification.sro.compensationFund')}
          value={fmtCurrency(result.compensationFund)}
        />

        {/* Allowed work types */}
        {result.allowedWorkTypes.length > 0 && (
          <div className="pt-2">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('procurement.prequalification.sro.allowedWorks')}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {result.allowedWorkTypes.map((wt, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  {wt}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer -- verified at + source */}
      <div className="px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="flex items-center gap-1">
          <CheckCircle size={12} className="text-green-500" />
          {t('procurement.prequalification.sro.verifiedAt')}: {fmtDate(result.verifiedAt)}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
          {t('procurement.prequalification.sro.source')}: {result.source}
        </span>
      </div>

      {/* Re-verify */}
      <div className="px-4 pb-3">
        <Button
          variant="ghost"
          size="xs"
          iconLeft={
            verifyMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Shield size={14} />
            )
          }
          onClick={handleVerify}
          disabled={verifyMutation.isPending}
        >
          {verifyMutation.isPending
            ? t('procurement.prequalification.sro.verifying')
            : t('procurement.prequalification.sro.verify')}
        </Button>
      </div>
    </div>
  );
};

export default SroVerificationCard;
