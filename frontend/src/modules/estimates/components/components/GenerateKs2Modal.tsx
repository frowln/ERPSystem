import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { closingApi } from '@/api/closing';
import { contractsApi } from '@/api/contracts';
import { formatMoney } from '@/lib/format';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface GenerateKs2ModalProps {
  open: boolean;
  onClose: () => void;
  estimateId: string;
  estimateName: string;
  projectId?: string;
}

const GenerateKs2Modal: React.FC<GenerateKs2ModalProps> = ({
  open,
  onClose,
  estimateId,
  estimateName,
  projectId,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Default period: current month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const [periodFrom, setPeriodFrom] = useState(firstOfMonth);
  const [periodTo, setPeriodTo] = useState(lastOfMonth);
  const [completionPercent, setCompletionPercent] = useState(100);
  const [selectedContractId, setSelectedContractId] = useState('');

  // Fetch contracts for this project
  const { data: contractsData, isLoading: loadingContracts } = useQuery({
    queryKey: ['contracts', projectId],
    queryFn: () => contractsApi.getContracts({ projectId, page: 0, size: 50 }),
    enabled: open && !!projectId,
  });
  const contracts = contractsData?.content ?? [];

  const contractOptions = useMemo(
    () =>
      contracts.map((c) => ({
        value: c.id,
        label: `${c.number} - ${c.name}`,
      })),
    [contracts],
  );

  // Estimated amount placeholder (completion-based)
  // We don't know the total from the estimate itself in this modal,
  // so we show the completion percentage as a visual indicator
  const estimatedAmountLabel = useMemo(() => {
    return `${completionPercent}%`;
  }, [completionPercent]);

  const generateMutation = useMutation({
    mutationFn: () =>
      closingApi.generateKs2FromEstimate({
        estimateId,
        contractId: selectedContractId || undefined,
        periodFrom,
        periodTo,
        completionPercent,
      }),
    onSuccess: (resp) => {
      const ks2Id = resp.id;
      toast.success(t('closing.ks2Generate.success'));
      queryClient.invalidateQueries({ queryKey: ['ks2-documents'] });
      queryClient.invalidateQueries({ queryKey: ['local-estimate', estimateId] });
      onClose();
      navigate(`/closing/ks2/${ks2Id}`);
    },
    onError: () => {
      toast.error(t('closing.ks2Generate.error'));
    },
  });

  const canSubmit = !!periodFrom && !!periodTo && completionPercent > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('closing.ks2Generate.title')}
      description={t('closing.ks2Generate.subtitle')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!canSubmit}
            loading={generateMutation.isPending}
            iconLeft={<FileText size={16} />}
            onClick={() => generateMutation.mutate()}
          >
            {generateMutation.isPending
              ? t('closing.ks2Generate.generating')
              : t('closing.ks2Generate.generate')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Period selection */}
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('closing.ks2Generate.periodFrom')} required>
            <Input
              type="date"
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
            />
          </FormField>
          <FormField label={t('closing.ks2Generate.periodTo')} required>
            <Input
              type="date"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
            />
          </FormField>
        </div>

        {/* Completion percentage */}
        <FormField label={`${t('closing.ks2Generate.completionPercent')}: ${completionPercent}%`}>
          <div className="space-y-2">
            <Input
              type="range"
              min="1"
              max="100"
              step="1"
              value={completionPercent}
              onChange={(e) => setCompletionPercent(Number(e.target.value))}
              className="!h-2 !px-0 !border-0 !rounded-lg appearance-none cursor-pointer accent-primary-600 bg-neutral-200 dark:bg-neutral-700"
            />
            <div className="flex justify-between text-xs text-neutral-400 dark:text-neutral-500">
              <span>1%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </FormField>

        {/* Contract selector */}
        <FormField label={t('closing.ks2Generate.selectContract')}>
          {loadingContracts ? (
            <Input disabled value="" placeholder="..." />
          ) : (
            <Select
              options={contractOptions}
              placeholder={t('closing.ks2Generate.selectContractPlaceholder')}
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
            />
          )}
        </FormField>

        {/* Preview section */}
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 space-y-2.5">
          <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
            {t('closing.ks2Generate.preview')}
          </p>
          <div className="space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            <div className="flex justify-between">
              <span>{t('closing.ks2Generate.estimateName')}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate ml-4 max-w-[60%] text-right">
                {estimateName}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('closing.ks2Generate.period')}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {periodFrom} — {periodTo}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{t('closing.ks2Generate.completion')}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {completionPercent}%
              </span>
            </div>
            {/* Completion bar */}
            <div className="pt-1">
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default GenerateKs2Modal;
