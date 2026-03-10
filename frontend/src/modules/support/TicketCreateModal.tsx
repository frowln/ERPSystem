import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { supportApi } from '@/api/support';
import type { CreateTicketRequest } from './types';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';

interface TicketCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const getPriorityOptions = () => [
  { value: 'LOW', label: t('support.priorityLow') },
  { value: 'MEDIUM', label: t('support.priorityMedium') },
  { value: 'HIGH', label: t('support.priorityHigh') },
  { value: 'CRITICAL', label: t('support.priorityCritical') },
];

const getFallbackCategoryOptions = () => [
  { value: 'TECHNICAL', label: t('support.catTechnical') },
  { value: 'ACCESS', label: t('support.catAccess') },
  { value: 'DOCUMENTS', label: t('support.catDocuments') },
  { value: 'EQUIPMENT', label: t('support.catEquipment') },
  { value: 'SAFETY', label: t('support.catSafety') },
  { value: 'SCHEDULE', label: t('support.catSchedule') },
  { value: 'OTHER', label: t('support.catOther') },
];

export const TicketCreateModal: React.FC<TicketCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const fallbackReporterName = `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim();
  const reporterName = (currentUser?.fullName ?? fallbackReporterName) || currentUser?.email || t('support.currentUser');

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [category, setCategory] = useState('TECHNICAL');
  const [dueDate, setDueDate] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['support-ticket-categories'],
    queryFn: () => supportApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  });

  const categoryOptions = useMemo(
    () => (
      categories && categories.length > 0
        ? categories.map((categoryRow) => ({
          value: categoryRow.code,
          label: categoryRow.name,
        }))
        : getFallbackCategoryOptions()
    ),
    [categories],
  );

  useEffect(() => {
    if (categoryOptions.length === 0) return;
    const hasCurrentValue = categoryOptions.some((option) => option.value === category);
    if (!hasCurrentValue) {
      setCategory(categoryOptions[0]?.value ?? 'OTHER');
    }
  }, [category, categoryOptions]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateTicketRequest) => supportApi.createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success(t('support.ticketCreated'));
      resetForm();
      onClose();
    },
    onError: () => {
      toast.error(t('support.errorCreateTicket'));
    },
  });

  const resetForm = () => {
    setSubject('');
    setDescription('');
    setPriority('MEDIUM');
    setCategory('TECHNICAL');
    setDueDate('');
  };

  const handleSubmit = () => {
    const normalizedSubject = subject.trim();
    const normalizedDescription = description.trim();

    if (!normalizedSubject || !normalizedDescription) {
      toast.error(t('support.validationRequired'));
      return;
    }

    const payload: CreateTicketRequest = {
      subject: normalizedSubject,
      description: normalizedDescription,
      priority: priority as CreateTicketRequest['priority'],
      category,
      reporterId: currentUser?.id,
      dueDate: dueDate || undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('support.createTitle')}
      description={t('support.createDescription')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('support.createCancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!subject || !description} loading={createMutation.isPending}>
            {t('support.createSubmit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label={t('support.labelReporter')}>
          <Input
            value={reporterName}
            readOnly
          />
        </FormField>

        <FormField label={t('support.labelSubjectField')} required>
          <Input
            placeholder={t('support.placeholderSubject')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </FormField>

        <FormField label={t('support.labelDescriptionField')} required>
          <Textarea
            placeholder={t('support.placeholderDescription')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('support.labelCategory')} required>
            <Select
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </FormField>

          <FormField label={t('support.labelPriorityField')} required>
            <Select
              options={getPriorityOptions()}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label={t('support.labelDesiredDeadline')}>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default TicketCreateModal;
