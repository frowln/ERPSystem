import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Edit3,
  Calculator,
  Calendar,
  FileText,
  Hash,
  Tag,
  Building2,
  FolderKanban,
} from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { MetricCard } from '@/design-system/components/MetricCard';
import { StatusBadge, type BadgeColor } from '@/design-system/components/StatusBadge';
import { Input } from '@/design-system/components/FormField';
import { priceCoefficientApi } from './api';
import { formatDate, formatDateLong, formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { PriceCoefficient, PriceCoefficientType, PriceCoefficientCalculation } from './types';

const statusColorMap: Record<string, BadgeColor> = {
  ACTIVE: 'green',
  INACTIVE: 'gray',
  DRAFT: 'yellow',
  EXPIRED: 'red',
};

const getStatusLabels = (): Record<string, string> => ({
  ACTIVE: t('priceCoefficients.statusActive'),
  INACTIVE: t('priceCoefficients.statusInactive'),
  DRAFT: t('priceCoefficients.statusDraft'),
  EXPIRED: t('priceCoefficients.statusExpired'),
});

const getTypeLabels = (): Record<PriceCoefficientType, string> => ({
  REGIONAL: t('priceCoefficients.typeRegional'),
  SEASONAL: t('priceCoefficients.typeSeasonal'),
  MATERIAL: t('priceCoefficients.typeMaterial'),
  LABOR: t('priceCoefficients.typeLabor'),
  EQUIPMENT: t('priceCoefficients.typeEquipment'),
  OVERHEAD: t('priceCoefficients.typeOverhead'),
  CUSTOM: t('priceCoefficients.typeCustom'),
});


const PriceCoefficientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [basePrice, setBasePrice] = useState('');
  const [calcResult, setCalcResult] = useState<PriceCoefficientCalculation | null>(null);

  const { data: coefficient } = useQuery<PriceCoefficient>({
    queryKey: ['price-coefficient', id],
    queryFn: () => priceCoefficientApi.getById(id!),
    enabled: !!id,
  });

  const calculateMutation = useMutation({
    mutationFn: () => priceCoefficientApi.calculatePrice(Number(basePrice.replace(/\s/g, '')), [id!]),
    onSuccess: (data) => setCalcResult(data),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  if (!coefficient) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center h-64 text-neutral-400">{t('common.loading')}</div>
      </div>
    );
  }

  const c = coefficient;
  const numericBase = Number(basePrice.replace(/\s/g, '')) || 0;
  const localResult = numericBase > 0 ? numericBase * c.value : 0;
  const typeLabels = getTypeLabels();
  const statusLabels = getStatusLabels();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={c.name}
        subtitle={`${c.code} / ${typeLabels[c.type] ?? c.type}`}
        backTo="/price-coefficients"
        breadcrumbs={[
          { label: t('priceCoefficients.breadcrumbHome'), href: '/' },
          { label: t('priceCoefficients.breadcrumbPriceCoefficients'), href: '/price-coefficients' },
          { label: c.code },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={c.status}
              colorMap={statusColorMap}
              label={statusLabels[c.status] ?? c.status}
              size="md"
            />
            <Button
              variant="secondary"
              size="sm"
              iconLeft={<Edit3 size={14} />}
              onClick={() => navigate(`/price-coefficients/${id}/edit`)}
            >
              {t('priceCoefficients.edit')}
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={<Hash size={18} />} label={t('priceCoefficients.detailCode')} value={c.code} />
          <MetricCard icon={<Calculator size={18} />} label={t('priceCoefficients.detailValue')} value={c.value.toFixed(4)} />
          <MetricCard icon={<Calendar size={18} />} label={t('priceCoefficients.detailEffectiveFrom')} value={formatDate(c.effectiveFrom)} />
          <MetricCard icon={<Calendar size={18} />} label={t('priceCoefficients.detailEffectiveTo')} value={c.effectiveTo ? formatDate(c.effectiveTo) : t('priceCoefficients.indefinite')} />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('priceCoefficients.detailInfoTitle')}</h3>

            {c.description && (
              <p className="text-sm text-neutral-600 leading-relaxed mb-6 pb-6 border-b border-neutral-100">
                {c.description}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8">
              <InfoItem icon={<Tag size={15} />} label={t('priceCoefficients.detailType')} value={typeLabels[c.type] ?? c.type} />
              <InfoItem icon={<Calculator size={15} />} label={t('priceCoefficients.detailValue')} value={c.value.toFixed(4)} />
              <InfoItem icon={<Calendar size={15} />} label={t('priceCoefficients.detailEffectiveFrom')} value={formatDateLong(c.effectiveFrom)} />
              <InfoItem icon={<Calendar size={15} />} label={t('priceCoefficients.detailEffectiveTo')} value={c.effectiveTo ? formatDateLong(c.effectiveTo) : t('priceCoefficients.indefinite')} />
              {c.projectName && <InfoItem icon={<FolderKanban size={15} />} label={t('priceCoefficients.detailProject')} value={c.projectName} />}
              {c.contractName && <InfoItem icon={<Building2 size={15} />} label={t('priceCoefficients.detailContract')} value={c.contractName} />}
              <InfoItem icon={<FileText size={15} />} label={t('priceCoefficients.detailCreated')} value={formatDateLong(c.createdAt)} />
              <InfoItem icon={<FileText size={15} />} label={t('priceCoefficients.detailUpdated')} value={formatDateLong(c.updatedAt)} />
            </div>
          </div>

          {/* Calculate price section */}
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{t('priceCoefficients.calculateTitle')}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">{t('priceCoefficients.basePrice')}</p>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder={t('priceCoefficients.basePricePlaceholder')}
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                iconLeft={<Calculator size={14} />}
                onClick={() => calculateMutation.mutate()}
                disabled={numericBase <= 0}
                loading={calculateMutation.isPending}
              >
                {t('priceCoefficients.calculateBtn')}
              </Button>

              {numericBase > 0 && (
                <div className="pt-4 border-t border-neutral-100 space-y-3">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('priceCoefficients.basePrice')}</p>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{formatMoney(numericBase)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('priceCoefficients.coefficientLabel')}</p>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">x {c.value.toFixed(4)}</p>
                  </div>
                  <div className="pt-3 border-t border-neutral-100">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('priceCoefficients.resultLabel')}</p>
                    <p className="text-lg font-semibold text-primary-700 tabular-nums">
                      {formatMoney(calcResult?.resultPrice ?? localResult)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('priceCoefficients.differenceLabel')}</p>
                    <p className="text-sm font-medium text-warning-600 tabular-nums">
                      +{formatMoney((calcResult?.resultPrice ?? localResult) - numericBase)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3">
    <span className="text-neutral-400 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  </div>
);

export default PriceCoefficientDetailPage;
