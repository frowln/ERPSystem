import React, { useState } from 'react';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { t } from '@/i18n';
import toast from 'react-hot-toast';

interface IncidentInvestigateWizardProps {
  open: boolean;
  onClose: () => void;
  incidentId?: string;
}

interface CorrectiveAction {
  id: string;
  description: string;
  responsible: string;
  deadline: string;
}
const getRootCauseOptions = () => [
  { value: 'human', label: t('safety.investigateWizard.causeHuman') },
  { value: 'EQUIPMENT', label: t('safety.investigateWizard.causeEquipment') },
  { value: 'PROCESS', label: t('safety.investigateWizard.causeProcess') },
  { value: 'training', label: t('safety.investigateWizard.causeTraining') },
  { value: 'ppe', label: t('safety.investigateWizard.causePPE') },
  { value: 'organization', label: t('safety.investigateWizard.causeOrganization') },
  { value: 'environment', label: t('safety.investigateWizard.causeEnvironment') },
];

const getResponsibleOptions = () => [
  { value: 'r1', label: t('safety.investigateWizard.responsibleIvanov') },
  { value: 'r2', label: t('safety.investigateWizard.responsiblePetrov') },
  { value: 'r3', label: t('safety.investigateWizard.responsibleSidorov') },
  { value: 'r4', label: t('safety.investigateWizard.responsibleKozlova') },
];

const getSteps = () => [
  t('safety.investigateWizard.stepIncidentData'),
  t('safety.investigateWizard.stepInvestigationResults'),
  t('safety.investigateWizard.stepRootCauses'),
  t('safety.investigateWizard.stepCorrectiveActions'),
  t('safety.investigateWizard.stepCompletion'),
];

export const IncidentInvestigateWizard: React.FC<IncidentInvestigateWizardProps> = ({ open, onClose }) => {
  const [step, setStep] = useState(0);
  const [findings, setFindings] = useState('');
  const [rootCauses, setRootCauses] = useState<string[]>([]);
  const [rootCauseComment, setRootCauseComment] = useState('');
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [newAction, setNewAction] = useState('');
  const [newResponsible, setNewResponsible] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // TODO: replace with real API call
  const incident = { number: '', date: '', location: '', type: '', severity: '', injured: '', description: '' };

  const toggleRootCause = (value: string) => {
    setRootCauses((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  const addAction = () => {
    if (!newAction || !newResponsible || !newDeadline) return;
    setActions((prev) => [
      ...prev,
      {
        id: `action-${Date.now()}`,
        description: newAction,
        responsible: newResponsible,
        deadline: newDeadline,
      },
    ]);
    setNewAction('');
    setNewResponsible('');
    setNewDeadline('');
  };

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  const handleFinish = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success(`${t('safety.investigateWizard.toastCompleted')} ${incident.number}`);
    setSubmitting(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setFindings('');
    setRootCauses([]);
    setRootCauseComment('');
    setActions([]);
    setNewAction('');
    setNewResponsible('');
    setNewDeadline('');
    onClose();
  };

  const canNext =
    step === 0
      ? true
      : step === 1
        ? findings.trim() !== ''
        : step === 2
          ? rootCauses.length > 0
          : step === 3
            ? actions.length > 0
            : true;

  const STEPS = getSteps();

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('safety.investigateWizard.modalTitle')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('safety.investigateWizard.buttonCancel') : t('safety.investigateWizard.buttonBack')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('safety.investigateWizard.buttonNext')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('safety.investigateWizard.buttonFinish')}
            </Button>
          )}
        </>
      }
    >
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1 shrink-0">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                i <= step ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs ${i <= step ? 'text-neutral-900 dark:text-neutral-100 font-medium' : 'text-neutral-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-neutral-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Incident details */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-danger-600">{t('safety.investigateWizard.labelIncidentNumber')}</p>
                <p className="text-sm font-semibold text-danger-900">{incident.number}</p>
              </div>
              <div>
                <p className="text-xs text-danger-600">{t('safety.investigateWizard.labelDate')}</p>
                <p className="text-sm text-danger-900">{incident.date}</p>
              </div>
              <div>
                <p className="text-xs text-danger-600">{t('safety.investigateWizard.labelType')}</p>
                <p className="text-sm text-danger-900">{incident.type}</p>
              </div>
              <div>
                <p className="text-xs text-danger-600">{t('safety.investigateWizard.labelSeverity')}</p>
                <p className="text-sm text-danger-900">{incident.severity}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-danger-600">{t('safety.investigateWizard.labelLocation')}</p>
                <p className="text-sm text-danger-900">{incident.location}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-danger-600">{t('safety.investigateWizard.labelInjured')}</p>
                <p className="text-sm text-danger-900">{incident.injured}</p>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{t('safety.investigateWizard.labelDescription')}</p>
            <p className="text-sm text-neutral-800 dark:text-neutral-200">{incident.description}</p>
          </div>
        </div>
      )}

      {/* Step 2: Investigation findings */}
      {step === 1 && (
        <div className="space-y-4">
          <FormField label={t('safety.investigateWizard.labelFindings')} required hint={t('safety.investigateWizard.hintFindings')}>
            <Textarea
              placeholder={t('safety.investigateWizard.placeholderFindings')}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={8}
            />
          </FormField>
        </div>
      )}

      {/* Step 3: Root cause selection */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('safety.investigateWizard.rootCauseInstruction')}</p>
          <div className="grid grid-cols-1 gap-2">
            {getRootCauseOptions().map((cause) => (
              <label
                key={cause.value}
                className={`flex items-center gap-3 border rounded-lg px-4 py-2.5 cursor-pointer transition-colors ${
                  rootCauses.includes(cause.value) ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
                onClick={() => toggleRootCause(cause.value)}
              >
                <input
                  type="checkbox"
                  checked={rootCauses.includes(cause.value)}
                  onChange={() => toggleRootCause(cause.value)}
                  className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-600"
                />
                <span className="text-sm">{cause.label}</span>
              </label>
            ))}
          </div>
          <FormField label={t('safety.investigateWizard.labelRootCauseComment')}>
            <Textarea
              placeholder={t('safety.investigateWizard.placeholderRootCauseComment')}
              value={rootCauseComment}
              onChange={(e) => setRootCauseComment(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      )}

      {/* Step 4: Corrective actions */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('safety.investigateWizard.correctiveActionInstruction')}</p>

          {actions.length > 0 && (
            <div className="space-y-2">
              {actions.map((action) => (
                <div key={action.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{action.description}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {getResponsibleOptions().find((r) => r.value === action.responsible)?.label} | {t('safety.investigateWizard.actionDeadlinePrefix')} {action.deadline}
                    </p>
                  </div>
                  <button onClick={() => removeAction(action.id)} className="text-xs text-danger-600 hover:underline shrink-0">
                    {t('safety.investigateWizard.actionRemove')}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-3 space-y-3">
            <FormField label={t('safety.investigateWizard.labelActionDescription')}>
              <Textarea
                placeholder={t('safety.investigateWizard.placeholderActionDescription')}
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                rows={2}
              />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t('safety.investigateWizard.labelResponsible')}>
                <Select
                  options={getResponsibleOptions()}
                  value={newResponsible}
                  onChange={(e) => setNewResponsible(e.target.value)}
                  placeholder={t('safety.investigateWizard.placeholderResponsible')}
                />
              </FormField>
              <FormField label={t('safety.investigateWizard.labelDeadline')}>
                <Input type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
              </FormField>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={addAction}
              disabled={!newAction || !newResponsible || !newDeadline}
            >
              {t('safety.investigateWizard.buttonAddAction')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Complete */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{t('safety.investigateWizard.summaryPrefix')} <strong>{incident.number}</strong>:</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-3 text-sm">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('safety.investigateWizard.summaryRootCauses')}</p>
              <ul className="mt-1 space-y-0.5">
                {rootCauses.map((c) => (
                  <li key={c}>{getRootCauseOptions().find((o) => o.value === c)?.label}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('safety.investigateWizard.summaryCorrectiveActions')} ({actions.length})</p>
              <ul className="mt-1 space-y-0.5">
                {actions.map((a) => (
                  <li key={a.id}>{a.description} ({t('safety.investigateWizard.actionDeadlinePrefix')} {a.deadline})</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
            <p className="text-sm text-warning-800">
              {t('safety.investigateWizard.completionWarning')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
