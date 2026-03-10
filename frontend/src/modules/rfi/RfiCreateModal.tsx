import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { rfiApi } from '@/api/rfi';
import { projectsApi } from '@/api/projects';
import { permissionsApi } from '@/api/permissions';
import { t } from '@/i18n';
import type { CreateRfiRequest } from './types';
import toast from 'react-hot-toast';

interface RfiCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const getPriorityOptions = () => [
  { value: 'LOW', label: t('rfi.modalPriorityLow') },
  { value: 'NORMAL', label: t('rfi.modalPriorityNormal') },
  { value: 'HIGH', label: t('rfi.modalPriorityHigh') },
  { value: 'CRITICAL', label: t('rfi.modalPriorityCritical') },
];

export const RfiCreateModal: React.FC<RfiCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });
  const projectOptions = (projectsData?.content ?? []).map(p => ({ value: p.id, label: p.name }));

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => permissionsApi.getUsers(),
  });
  const assigneeOptions = (usersData?.content ?? []).map(u => ({ value: u.id, label: u.fullName ?? u.email }));
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [specSection, setSpecSection] = useState('');
  const [projectId, setProjectId] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: CreateRfiRequest) => rfiApi.createRfi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfis'] });
      toast.success(t('rfi.modalCreateSuccess'));
      setSubject('');
      setQuestion('');
      setPriority('NORMAL');
      setAssigneeId('');
      setDueDate('');
      setSpecSection('');
      setProjectId('');
      onClose();
    },
    onError: () => {
      toast.error(t('rfi.modalCreateError'));
    },
  });

  const handleSubmit = () => {
    const payload: CreateRfiRequest = {
      subject: subject.trim(),
      question: question.trim(),
      priority: priority as CreateRfiRequest['priority'],
      assignedToId: assigneeId || undefined,
      dueDate: dueDate || undefined,
      specSection: specSection.trim() || undefined,
      distributionList: [],
      projectId,
    };
    createMutation.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('rfi.modalTitle')}
      description={t('rfi.modalDescription')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('rfi.modalCancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!subject || !question} loading={createMutation.isPending}>
            {t('rfi.modalCreate')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label={t('rfi.modalLabelSubject')} required>
          <Input
            placeholder={t('rfi.modalPlaceholderSubject')}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </FormField>

        <FormField label={t('rfi.modalLabelQuestion')} required>
          <Textarea
            placeholder={t('rfi.modalPlaceholderQuestion')}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('rfi.modalLabelProject')} required>
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </FormField>

          <FormField label={t('rfi.modalLabelPriority')} required>
            <Select
              options={getPriorityOptions()}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </FormField>

          <FormField label={t('rfi.modalLabelAssignee')}>
            <Select
              options={assigneeOptions}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder={t('rfi.modalPlaceholderAssignee')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('rfi.modalLabelDueDate')}>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </FormField>

          <FormField label={t('rfi.modalLabelSpecSection')}>
            <Input
              placeholder={t('rfi.modalPlaceholderSpecSection')}
              value={specSection}
              onChange={(e) => setSpecSection(e.target.value)}
            />
          </FormField>
        </div>
      </div>
    </Modal>
  );
};

export default RfiCreateModal;
