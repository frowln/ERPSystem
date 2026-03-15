import React from 'react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Textarea } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import type { ProposalFormData } from './ClTypes';

interface ClEntryFormModalProps {
  open: boolean;
  onClose: () => void;
  form: ProposalFormData;
  onFormChange: (updater: (prev: ProposalFormData) => ProposalFormData) => void;
  onSubmit: () => void;
  isPending: boolean;
  defaultQuantity: string;
}

export const ClEntryFormModal: React.FC<ClEntryFormModalProps> = ({
  open,
  onClose,
  form,
  onFormChange,
  onSubmit,
  isPending,
  defaultQuantity,
}) => (
  <Modal
    open={open}
    onClose={onClose}
    title={t('competitiveList.detail.addProposal')}
    size="md"
    footer={
      <>
        <Button variant="secondary" size="sm" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          loading={isPending}
          onClick={onSubmit}
          disabled={!form.vendorName || !form.unitPrice}
        >
          {t('common.save')}
        </Button>
      </>
    }
  >
    <div className="space-y-4">
      <FormField label={t('competitiveList.entry.vendor')} required>
        <Input
          value={form.vendorName}
          onChange={(e) => onFormChange((prev) => ({ ...prev, vendorName: e.target.value }))}
          placeholder={t('competitiveList.entry.vendor')}
        />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('competitiveList.entry.price')} required>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.unitPrice}
            onChange={(e) => onFormChange((prev) => ({ ...prev, unitPrice: e.target.value }))}
            placeholder="0.00"
          />
        </FormField>
        <FormField label={t('competitiveList.entry.quantity')}>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.quantity}
            onChange={(e) => onFormChange((prev) => ({ ...prev, quantity: e.target.value }))}
            placeholder={defaultQuantity}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('competitiveList.entry.deliveryDays')}>
          <Input
            type="number"
            min="0"
            value={form.deliveryDays}
            onChange={(e) => onFormChange((prev) => ({ ...prev, deliveryDays: e.target.value }))}
            placeholder="0"
          />
        </FormField>
        <FormField label={t('competitiveList.entry.paymentTerms')}>
          <Input
            value={form.paymentTerms}
            onChange={(e) => onFormChange((prev) => ({ ...prev, paymentTerms: e.target.value }))}
          />
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField label={t('competitiveList.entry.prepayment')}>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.prepaymentPercent}
            onChange={(e) => onFormChange((prev) => ({ ...prev, prepaymentPercent: e.target.value }))}
            placeholder="0"
          />
        </FormField>
        <FormField label={t('competitiveList.entry.paymentDelay')}>
          <Input
            type="number"
            min="0"
            value={form.paymentDelayDays}
            onChange={(e) => onFormChange((prev) => ({ ...prev, paymentDelayDays: e.target.value }))}
            placeholder="0"
          />
        </FormField>
        <FormField label={t('competitiveList.entry.warranty')}>
          <Input
            type="number"
            min="0"
            value={form.warrantyMonths}
            onChange={(e) => onFormChange((prev) => ({ ...prev, warrantyMonths: e.target.value }))}
            placeholder="0"
          />
        </FormField>
      </div>
      <FormField label={t('common.notes')}>
        <Textarea
          value={form.notes}
          onChange={(e) => onFormChange((prev) => ({ ...prev, notes: e.target.value }))}
          rows={2}
        />
      </FormField>
    </div>
  </Modal>
);
