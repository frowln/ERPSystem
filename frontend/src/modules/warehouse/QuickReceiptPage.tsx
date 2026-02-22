import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, Package, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { Combobox } from '@/design-system/components/Combobox';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { warehouseApi } from '@/api/warehouse';
import { t } from '@/i18n';
import { useMaterialOptions, useWarehouseLocationOptions } from '@/hooks/useSelectOptions';
import { useAuthStore } from '@/stores/authStore';

interface ScannedMaterial {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

const QuickReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const { options: materialOptions } = useMaterialOptions();
  const { options: locationOptions } = useWarehouseLocationOptions();

  const [step, setStep] = useState<1 | 2>(1);
  const [showScanner, setShowScanner] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [material, setMaterial] = useState<ScannedMaterial | null>(null);
  const [materialId, setMaterialId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [quantityError, setQuantityError] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      warehouseApi.createMovement({
        number: `QR-${Date.now()}`,
        movementDate: new Date().toISOString().slice(0, 10),
        movementType: 'RECEIPT',
        destinationLocation: destinationLocation || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success(t('warehouse.quickReceipt.toastSuccess'));
      // Reset for next scan
      setStep(1);
      setMaterial(null);
      setMaterialId('');
      setQuantity('');
      setDestinationLocation('');
    },
    onError: () => {
      toast.error(t('warehouse.quickReceipt.toastError'));
    },
  });

  const handleBarcodeScan = useCallback(async (code: string) => {
    setShowScanner(false);
    setScanLoading(true);
    try {
      const mat = await warehouseApi.lookupMaterialByBarcode(code);
      setMaterial({ id: mat.id, name: mat.name, sku: mat.code ?? '', unit: mat.unitOfMeasure ?? '' });
      setMaterialId(mat.id);
      toast.success(t('warehouse.scanner.found', { name: mat.name }));
    } catch {
      toast.error(t('warehouse.scanner.notFound', { code }));
    } finally {
      setScanLoading(false);
    }
  }, []);

  function handleManualSelect(id: string) {
    setMaterialId(id);
    const opt = materialOptions.find((o) => o.value === id);
    if (opt) {
      setMaterial({ id, name: opt.label, sku: '', unit: '' });
    }
  }

  function goToStep2() {
    const qty = Number(quantity);
    if (!materialId) return;
    if (!quantity || qty <= 0) {
      setQuantityError(t('warehouse.quickReceipt.validationQtyPositive'));
      return;
    }
    setQuantityError('');
    setStep(2);
  }

  function handleConfirm() {
    createMutation.mutate();
  }

  return (
    <div className="animate-fade-in min-h-[calc(100vh-4rem)] flex flex-col">
      <PageHeader
        title={t('warehouse.quickReceipt.title')}
        subtitle={t('warehouse.quickReceipt.subtitle')}
        backTo="/warehouse/movements"
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.quickReceipt.breadcrumb') },
        ]}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6 px-1">
        <div
          className={`flex items-center gap-1.5 text-sm font-medium ${step === 1 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'}`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 1 ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
            }`}
          >
            {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
          </div>
          {t('warehouse.quickReceipt.step1')}
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
        <div
          className={`flex items-center gap-1.5 text-sm font-medium ${step === 2 ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'}`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 2 ? 'bg-blue-600 text-white' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
            }`}
          >
            2
          </div>
          {t('warehouse.quickReceipt.step2')}
        </div>
      </div>

      <div className="flex-1 max-w-lg">
        {step === 1 && (
          <div className="space-y-5">
            {/* Scan button */}
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              disabled={scanLoading}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {t('warehouse.quickReceipt.scanTitle')}
                </div>
                <div className="text-xs text-blue-600/70 dark:text-blue-400/70">
                  {t('warehouse.quickReceipt.scanHint')}
                </div>
              </div>
            </button>

            {/* Or manual select */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
              <span className="text-xs text-neutral-400 uppercase">{t('warehouse.quickReceipt.orManual')}</span>
              <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
            </div>

            <FormField label={t('warehouse.quickReceipt.labelMaterial')}>
              <Combobox
                options={materialOptions}
                value={materialId}
                onChange={handleManualSelect}
                placeholder={t('warehouse.quickReceipt.placeholderMaterial')}
              />
            </FormField>

            {/* Selected material card */}
            {material && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <Package className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                    {material.name}
                  </div>
                  {material.sku && (
                    <div className="text-xs text-green-600/70 dark:text-green-400/70 font-mono">{material.sku}</div>
                  )}
                </div>
              </div>
            )}

            {/* Quantity */}
            <FormField
              label={t('warehouse.quickReceipt.labelQuantity')}
              error={quantityError}
              required
            >
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (quantityError) setQuantityError('');
                }}
                hasError={!!quantityError}
                className="text-2xl font-bold text-center h-14"
              />
            </FormField>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            {/* Summary card */}
            <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
              <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase mb-2">
                {t('warehouse.quickReceipt.summaryTitle')}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">{t('warehouse.quickReceipt.summaryMaterial')}</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate ml-2 max-w-[60%] text-right">
                  {material?.name}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">{t('warehouse.quickReceipt.summaryQuantity')}</span>
                <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-300">{t('warehouse.quickReceipt.summaryType')}</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {t('warehouse.quickReceipt.typeReceipt')}
                </span>
              </div>
              {user && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">{t('warehouse.quickReceipt.summaryResponsible')}</span>
                  <span className="text-sm text-neutral-900 dark:text-neutral-100">
                    {user.fullName ?? `${user.firstName} ${user.lastName}`}
                  </span>
                </div>
              )}
            </div>

            {/* Optional: destination location */}
            <FormField label={t('warehouse.quickReceipt.labelLocation')}>
              <Select
                options={locationOptions}
                value={destinationLocation}
                onChange={(e) => setDestinationLocation(e.target.value)}
                placeholder={t('warehouse.quickReceipt.placeholderLocation')}
              />
            </FormField>

            {/* Back link */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('warehouse.quickReceipt.backToStep1')}
            </button>
          </div>
        )}
      </div>

      {/* Floating action button */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white dark:from-neutral-950 via-white/95 dark:via-neutral-950/95 to-transparent pt-8 -mx-4 sm:-mx-6 mt-auto">
        {step === 1 ? (
          <Button
            className="w-full h-12 text-base"
            disabled={!materialId}
            onClick={goToStep2}
            iconRight={<ChevronRight className="w-5 h-5" />}
          >
            {t('warehouse.quickReceipt.btnNext')}
          </Button>
        ) : (
          <Button
            className="w-full h-12 text-base"
            loading={createMutation.isPending}
            onClick={handleConfirm}
            iconLeft={<Check className="w-5 h-5" />}
          >
            {t('warehouse.quickReceipt.btnConfirm')}
          </Button>
        )}
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export default QuickReceiptPage;
