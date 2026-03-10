import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { safetyApi } from '@/api/safety';
import { projectsApi } from '@/api/projects';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { IncidentSeverity, IncidentType } from './types';

interface SafetyIncidentCreateModalProps {
  open: boolean;
  onClose: () => void;
}

const getSeverityOptions = () => [
  { value: 'MINOR', label: t('safety.incidentCreate.severityMinor') },
  { value: 'MODERATE', label: t('safety.incidentCreate.severityModerate') },
  { value: 'SERIOUS', label: t('safety.incidentCreate.severitySerious') },
  { value: 'CRITICAL', label: t('safety.incidentCreate.severityCritical') },
  { value: 'FATAL', label: t('safety.incidentCreate.severityFatal') },
];

const getTypeOptions = () => [
  { value: 'FALL', label: t('safety.incidentCreate.typeFall') },
  { value: 'STRUCK_BY', label: t('safety.incidentCreate.typeStruckBy') },
  { value: 'CAUGHT_IN', label: t('safety.incidentCreate.typeCaughtIn') },
  { value: 'ELECTROCUTION', label: t('safety.incidentCreate.typeElectrocution') },
  { value: 'COLLAPSE', label: t('safety.incidentCreate.typeCollapse') },
  { value: 'FIRE', label: t('safety.incidentCreate.typeFire') },
  { value: 'CHEMICAL', label: t('safety.incidentCreate.typeChemical') },
  { value: 'EQUIPMENT', label: t('safety.incidentCreate.typeEquipment') },
  { value: 'OTHER', label: t('safety.incidentCreate.typeOther') },
];

export const SafetyIncidentCreateModal: React.FC<SafetyIncidentCreateModalProps> = ({ open, onClose }) => {
  const [incidentType, setIncidentType] = useState('FALL');
  const [severity, setSeverity] = useState('MODERATE');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [projectId, setProjectId] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [description, setDescription] = useState('');
  const [injuredEmployeeName, setInjuredEmployeeName] = useState('');
  const [witnessNames, setWitnessNames] = useState('');
  const [workDaysLost, setWorkDaysLost] = useState('');
  const [medicalTreatment, setMedicalTreatment] = useState(false);
  const [hospitalization, setHospitalization] = useState(false);
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects(),
  });
  const projectOptions = (projectsData?.content ?? []).map(p => ({ value: p.id, label: p.name }));

  const createMutation = useMutation({
    mutationFn: () => {
      // Combine date + time into ISO datetime (backend expects LocalDateTime)
      const dateTimeCombined = incidentTime
        ? `${incidentDate}T${incidentTime}:00`
        : `${incidentDate}T00:00:00`;

      return safetyApi.createIncident({
        incidentDate: dateTimeCombined,
        projectId: projectId,
        locationDescription: locationDescription,
        severity: severity as IncidentSeverity,
        incidentType: incidentType as IncidentType,
        description: description,
        injuredEmployeeName: injuredEmployeeName || undefined,
        witnessNames: witnessNames || undefined,
        workDaysLost: workDaysLost ? Number(workDaysLost) : undefined,
        medicalTreatment: medicalTreatment || undefined,
        hospitalization: hospitalization || undefined,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-incidents'] });
      toast.success(t('safety.incidentCreate.toastCreated'));
      resetForm();
      onClose();
    },
    onError: () => {
      toast.error(t('safety.incidentCreate.toastError'));
    },
  });

  const resetForm = () => {
    setIncidentType('FALL');
    setSeverity('MODERATE');
    setIncidentDate('');
    setIncidentTime('');
    setProjectId('');
    setLocationDescription('');
    setDescription('');
    setInjuredEmployeeName('');
    setWitnessNames('');
    setWorkDaysLost('');
    setMedicalTreatment(false);
    setHospitalization(false);
    setNotes('');
  };

  const handleSubmit = () => {
    createMutation.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title={t('safety.incidentCreate.modalTitle')}
      description={t('safety.incidentCreate.modalDescription')}
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              resetForm();
            }}
          >
            {t('safety.incidentCreate.buttonCancel')}
          </Button>
          <Button onClick={handleSubmit} loading={createMutation.isPending} disabled={!incidentDate || !projectId || !locationDescription || !description}>
            {t('safety.incidentCreate.buttonSubmit')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('safety.incidentCreate.labelIncidentType')} required>
            <Select
              options={getTypeOptions()}
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
            />
          </FormField>
          <FormField label={t('safety.incidentCreate.labelSeverity')} required>
            <Select
              options={getSeverityOptions()}
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('safety.incidentCreate.labelIncidentDate')} required>
            <Input
              type="date"
              value={incidentDate}
              onChange={(e) => setIncidentDate(e.target.value)}
            />
          </FormField>
          <FormField label={t('safety.incidentCreate.labelIncidentTime')}>
            <Input
              type="time"
              value={incidentTime}
              onChange={(e) => setIncidentTime(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label={t('safety.incidentCreate.labelProject')} required>
          <Select
            options={projectOptions}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder={t('safety.incidentCreate.placeholderProject')}
          />
        </FormField>

        <FormField label={t('safety.incidentCreate.labelLocation')} required>
          <Input
            placeholder={t('safety.incidentCreate.placeholderLocation')}
            value={locationDescription}
            onChange={(e) => setLocationDescription(e.target.value)}
          />
        </FormField>

        <FormField label={t('safety.incidentCreate.labelDescription')} required>
          <Textarea
            placeholder={t('safety.incidentCreate.placeholderDescription')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('safety.incidentCreate.labelInjuredEmployeeName')}>
            <Input
              placeholder={t('safety.incidentCreate.placeholderInjuredEmployeeName')}
              value={injuredEmployeeName}
              onChange={(e) => setInjuredEmployeeName(e.target.value)}
            />
          </FormField>
          <FormField label={t('safety.incidentCreate.labelWitnessNames')}>
            <Input
              placeholder={t('safety.incidentCreate.placeholderWitnessNames')}
              value={witnessNames}
              onChange={(e) => setWitnessNames(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label={t('safety.incidentCreate.labelWorkDaysLost')}>
            <Input
              type="number"
              min="0"
              value={workDaysLost}
              onChange={(e) => setWorkDaysLost(e.target.value)}
            />
          </FormField>
          <FormField label={t('safety.incidentCreate.labelMedicalTreatment')}>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={medicalTreatment}
                onChange={(e) => setMedicalTreatment(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-600"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('safety.incidentCreate.labelMedicalTreatmentHint')}</span>
            </label>
          </FormField>
          <FormField label={t('safety.incidentCreate.labelHospitalization')}>
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hospitalization}
                onChange={(e) => setHospitalization(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-600"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{t('safety.incidentCreate.labelHospitalizationHint')}</span>
            </label>
          </FormField>
        </div>

        <FormField label={t('safety.incidentCreate.labelNotes')}>
          <Textarea
            placeholder={t('safety.incidentCreate.placeholderNotes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default SafetyIncidentCreateModal;
