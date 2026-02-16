import React, { useState } from 'react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

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

const projectOptions = [
  { value: '1', label: 'ЖК "Солнечный"' },
  { value: '3', label: 'Мост через р. Вятка' },
  { value: '6', label: 'ТЦ "Центральный"' },
];

export const SafetyIncidentCreateModal: React.FC<SafetyIncidentCreateModalProps> = ({ open, onClose }) => {
  const [incidentType, setIncidentType] = useState('FALL');
  const [severity, setSeverity] = useState('MODERATE');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentTime, setIncidentTime] = useState('');
  const [projectId, setProjectId] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [injuredPersons, setInjuredPersons] = useState('0');

  const resetForm = () => {
    setIncidentType('FALL');
    setSeverity('MODERATE');
    setIncidentDate('');
    setIncidentTime('');
    setProjectId('');
    setLocation('');
    setDescription('');
    setInjuredPersons('0');
  };

  const handleSubmit = () => {
    toast.success(t('safety.incidentCreate.toastCreated'));
    onClose();
    resetForm();
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
          <Button onClick={handleSubmit} disabled={!incidentDate || !projectId || !location || !description}>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label={t('safety.incidentCreate.labelProject')} required>
            <Select
              options={projectOptions}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder={t('safety.incidentCreate.placeholderProject')}
            />
          </FormField>
          <FormField label={t('safety.incidentCreate.labelInjuredCount')}>
            <Input
              type="number"
              min="0"
              value={injuredPersons}
              onChange={(e) => setInjuredPersons(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label={t('safety.incidentCreate.labelLocation')} required>
          <Input
            placeholder={t('safety.incidentCreate.placeholderLocation')}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </FormField>

        <FormField label={t('safety.incidentCreate.labelDescription')} required>
          <Textarea
            placeholder={t('safety.incidentCreate.placeholderDescription')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
        </FormField>
      </div>
    </Modal>
  );
};

export default SafetyIncidentCreateModal;
