import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowRight, Plus, Trash2, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { Combobox } from '@/design-system/components/Combobox';
import { warehouseApi } from '@/api/warehouse';
import { t } from '@/i18n';
import {
  useProjectOptions,
  useMaterialOptions,
  useWarehouseLocationOptions,
  useEmployeeOptions,
} from '@/hooks/useSelectOptions';

interface TransferLine {
  id: string;
  materialId: string;
  materialLabel: string;
  quantity: string;
}

const InterSiteTransferPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { options: projectOptions } = useProjectOptions();
  const { options: materialOptions } = useMaterialOptions();
  const { options: locationOptions } = useWarehouseLocationOptions();
  const { options: responsibleOptions } = useEmployeeOptions('ACTIVE');

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: source & destination
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [sourceProjectId, setSourceProjectId] = useState('');
  const [destinationProjectId, setDestinationProjectId] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [notes, setNotes] = useState('');

  // Step 2: material lines
  const [lines, setLines] = useState<TransferLine[]>([
    { id: crypto.randomUUID(), materialId: '', materialLabel: '', quantity: '' },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: () =>
      warehouseApi.createInterSiteTransfer({
        movementDate: new Date().toISOString().slice(0, 10),
        sourceLocationId,
        destinationLocationId,
        sourceProjectId: sourceProjectId || undefined,
        destinationProjectId: destinationProjectId || undefined,
        responsibleId: responsibleId || undefined,
        notes: notes || undefined,
        lines: lines.map((l) => ({
          materialId: l.materialId,
          quantity: Number(l.quantity),
        })),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      toast.success(t('warehouse.interSiteTransfer.toastSuccess'));
      navigate(`/warehouse/movements/${data.id}`);
    },
    onError: () => {
      toast.error(t('warehouse.interSiteTransfer.toastError'));
    },
  });

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!sourceLocationId) errs.sourceLocationId = t('warehouse.interSiteTransfer.validationSourceRequired');
    if (!destinationLocationId) errs.destinationLocationId = t('warehouse.interSiteTransfer.validationDestRequired');
    if (sourceLocationId && destinationLocationId && sourceLocationId === destinationLocationId) {
      errs.destinationLocationId = t('warehouse.interSiteTransfer.validationSameLocation');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    const validLines = lines.filter((l) => l.materialId);
    if (validLines.length === 0) {
      errs.lines = t('warehouse.interSiteTransfer.validationNoLines');
    }
    for (const line of validLines) {
      const qty = Number(line.quantity);
      if (!line.quantity || qty <= 0) {
        errs[`qty-${line.id}`] = t('warehouse.interSiteTransfer.validationQtyPositive');
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goToStep2() {
    if (validateStep1()) {
      setStep(2);
    }
  }

  function handleConfirm() {
    if (validateStep2()) {
      createMutation.mutate();
    }
  }

  function addLine() {
    setLines((prev) => [...prev, { id: crypto.randomUUID(), materialId: '', materialLabel: '', quantity: '' }]);
  }

  function removeLine(id: string) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function updateLine(id: string, field: keyof TransferLine, value: string) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        if (field === 'materialId') {
          const opt = materialOptions.find((o) => o.value === value);
          return { ...l, materialId: value, materialLabel: opt?.label ?? '' };
        }
        return { ...l, [field]: value };
      }),
    );
  }

  const sourceLabel = locationOptions.find((o) => o.value === sourceLocationId)?.label ?? '';
  const destLabel = locationOptions.find((o) => o.value === destinationLocationId)?.label ?? '';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('warehouse.interSiteTransfer.title')}
        subtitle={t('warehouse.interSiteTransfer.subtitle')}
        backTo="/warehouse/movements"
        breadcrumbs={[
          { label: t('warehouse.breadcrumbHome'), href: '/' },
          { label: t('warehouse.breadcrumbWarehouse'), href: '/warehouse/materials' },
          { label: t('warehouse.interSiteTransfer.breadcrumb') },
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
          {t('warehouse.interSiteTransfer.step1Title')}
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
          {t('warehouse.interSiteTransfer.step2Title')}
        </div>
      </div>

      <div className="max-w-3xl">
        {step === 1 && (
          <div className="space-y-6">
            {/* Transfer direction card */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
                {t('warehouse.interSiteTransfer.sectionDirection')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                <FormField
                  label={t('warehouse.interSiteTransfer.labelSource')}
                  error={errors.sourceLocationId}
                  required
                >
                  <Select
                    options={locationOptions}
                    value={sourceLocationId}
                    onChange={(e) => setSourceLocationId(e.target.value)}
                    placeholder={t('warehouse.interSiteTransfer.placeholderSource')}
                    hasError={!!errors.sourceLocationId}
                  />
                </FormField>
                <div className="hidden sm:flex items-center justify-center pb-1">
                  <ArrowRight className="w-5 h-5 text-neutral-400" />
                </div>
                <FormField
                  label={t('warehouse.interSiteTransfer.labelDest')}
                  error={errors.destinationLocationId}
                  required
                >
                  <Select
                    options={locationOptions}
                    value={destinationLocationId}
                    onChange={(e) => setDestinationLocationId(e.target.value)}
                    placeholder={t('warehouse.interSiteTransfer.placeholderDest')}
                    hasError={!!errors.destinationLocationId}
                  />
                </FormField>
              </div>
            </section>

            {/* Projects (optional) */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
                {t('warehouse.interSiteTransfer.sectionProjects')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField label={t('warehouse.interSiteTransfer.labelSourceProject')}>
                  <Combobox
                    options={projectOptions}
                    value={sourceProjectId}
                    onChange={setSourceProjectId}
                    placeholder={t('warehouse.interSiteTransfer.placeholderProject')}
                  />
                </FormField>
                <FormField label={t('warehouse.interSiteTransfer.labelDestProject')}>
                  <Combobox
                    options={projectOptions}
                    value={destinationProjectId}
                    onChange={setDestinationProjectId}
                    placeholder={t('warehouse.interSiteTransfer.placeholderProject')}
                  />
                </FormField>
              </div>
            </section>

            {/* Responsible & notes */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">
                {t('warehouse.interSiteTransfer.sectionAdditional')}
              </h2>
              <div className="space-y-4">
                <FormField label={t('warehouse.interSiteTransfer.labelResponsible')}>
                  <Combobox
                    options={responsibleOptions}
                    value={responsibleId}
                    onChange={setResponsibleId}
                    placeholder={t('warehouse.interSiteTransfer.placeholderResponsible')}
                  />
                </FormField>
                <FormField label={t('warehouse.interSiteTransfer.labelNotes')}>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('warehouse.interSiteTransfer.placeholderNotes')}
                    rows={2}
                  />
                </FormField>
              </div>
            </section>

            <div className="flex items-center gap-3">
              <Button onClick={goToStep2} iconRight={<ChevronRight className="w-4 h-4" />}>
                {t('warehouse.interSiteTransfer.btnNext')}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/warehouse/movements')}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Direction summary */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{sourceLabel}</span>
              <ArrowRight className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">{destLabel}</span>
            </div>

            {/* Material lines */}
            <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('warehouse.interSiteTransfer.sectionMaterials')}
                </h2>
                <Button type="button" variant="secondary" size="sm" onClick={addLine} iconLeft={<Plus className="w-4 h-4" />}>
                  {t('warehouse.interSiteTransfer.btnAddLine')}
                </Button>
              </div>

              {errors.lines && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-3">{errors.lines}</p>
              )}

              <div className="space-y-4">
                {lines.map((line, idx) => (
                  <div key={line.id} className="flex items-start gap-3">
                    <span className="text-xs text-neutral-400 pt-2.5 w-5 shrink-0 text-right">{idx + 1}</span>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
                      <FormField label={idx === 0 ? t('warehouse.interSiteTransfer.colMaterial') : undefined}>
                        <Combobox
                          options={materialOptions}
                          value={line.materialId}
                          onChange={(val) => updateLine(line.id, 'materialId', val)}
                          placeholder={t('warehouse.interSiteTransfer.placeholderMaterial')}
                        />
                      </FormField>
                      <FormField
                        label={idx === 0 ? t('warehouse.interSiteTransfer.colQuantity') : undefined}
                        error={errors[`qty-${line.id}`]}
                      >
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                          hasError={!!errors[`qty-${line.id}`]}
                        />
                      </FormField>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 1}
                      className="p-1.5 mt-1 text-neutral-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleConfirm}
                loading={createMutation.isPending}
                iconLeft={<Check className="w-4 h-4" />}
              >
                {t('warehouse.interSiteTransfer.btnCreate')}
              </Button>
              <Button variant="secondary" onClick={() => setStep(1)} iconLeft={<ArrowLeft className="w-4 h-4" />}>
                {t('warehouse.interSiteTransfer.btnBack')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterSiteTransferPage;
