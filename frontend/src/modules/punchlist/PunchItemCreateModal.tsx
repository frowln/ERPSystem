import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { punchlistApi } from '@/api/punchlist';
import { permissionsApi } from '@/api/permissions';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface PunchItemCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const getPriorityOptions = () => [
  { value: 'LOW', label: t('punchlist.priorityLow') },
  { value: 'MEDIUM', label: t('punchlist.priorityMedium') },
  { value: 'HIGH', label: t('punchlist.priorityHigh') },
  { value: 'CRITICAL', label: t('punchlist.priorityCritical') },
];

const getCategoryOptions = () => [
  { value: 'STRUCTURAL', label: t('punchlist.catStructural') },
  { value: 'ARCHITECTURAL', label: t('punchlist.catArchitectural') },
  { value: 'MECHANICAL', label: t('punchlist.catMechanical') },
  { value: 'ELECTRICAL', label: t('punchlist.catElectrical') },
  { value: 'PLUMBING', label: t('punchlist.catPlumbing') },
  { value: 'FINISHING', label: t('punchlist.catFinishing') },
  { value: 'FIRE_SAFETY', label: t('punchlist.catFireSafety') },
  { value: 'LANDSCAPING', label: t('punchlist.catLandscaping') },
  { value: 'OTHER', label: t('punchlist.catOther') },
];

export const PunchItemCreateModal: React.FC<PunchItemCreateModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();

  const { data: punchListsData } = useQuery({
    queryKey: ['punch-lists'],
    queryFn: () => punchlistApi.getPunchLists(),
    enabled: open,
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => permissionsApi.getUsers({ page: 0, size: 100 }),
    enabled: open,
  });

  const punchListOptions = (punchListsData?.content ?? []).map((pl: any) => ({ value: pl.id, label: pl.name }));
  const assigneeOptions = (usersData?.content ?? []).map((u) => ({ value: u.id, label: `${u.lastName} ${u.firstName[0]}.` }));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [punchListId, setPunchListId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [floor, setFloor] = useState('');
  const [room, setRoom] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => punchlistApi.createPunchItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punch-items'] });
      queryClient.invalidateQueries({ queryKey: ['punch-lists'] });
      onClose();
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({
      title, description, punchListId, priority: priority as any, category: category as any,
      location, floor, room, assignedToId: assigneeId, dueDate,
    } as any);
    onClose();
    setTitle('');
    setDescription('');
    setPunchListId('');
    setPriority('MEDIUM');
    setCategory('');
    setLocation('');
    setFloor('');
    setRoom('');
    setAssigneeId('');
    setDueDate('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('punchlist.modalTitle')}
      description={t('punchlist.modalDescription')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('punchlist.modalCancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!title || !description || !category || !location}>
            {t('punchlist.modalCreate')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label={t('punchlist.labelPunchListField')} required>
          <Select
            options={punchListOptions}
            value={punchListId}
            onChange={(e) => setPunchListId(e.target.value)}
            placeholder={t('punchlist.placeholderSelectList')}
          />
        </FormField>

        <FormField label={t('punchlist.labelTitleField')} required>
          <Input
            placeholder={t('punchlist.placeholderTitleField')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>

        <FormField label={t('punchlist.labelDescriptionField')} required>
          <Textarea
            placeholder={t('punchlist.placeholderDescriptionField')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('punchlist.labelCategoryField')} required>
            <Select
              options={getCategoryOptions()}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('punchlist.placeholderSelectCategory')}
            />
          </FormField>
          <FormField label={t('punchlist.labelPriorityField')} required>
            <Select
              options={getPriorityOptions()}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label={t('punchlist.labelLocationField')} required>
          <Input
            placeholder={t('punchlist.placeholderLocationField')}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('punchlist.labelFloorField')}>
            <Input
              placeholder={t('punchlist.placeholderFloorField')}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </FormField>
          <FormField label={t('punchlist.labelRoomField')}>
            <Input
              placeholder={t('punchlist.placeholderRoomField')}
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('punchlist.labelAssigneeField')}>
            <Select
              options={assigneeOptions}
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              placeholder={t('punchlist.placeholderSelectAssignee')}
            />
          </FormField>
          <FormField label={t('punchlist.labelDueDateField')}>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </FormField>
        </div>
      </div>
    </Modal>
  );
};

export default PunchItemCreateModal;
