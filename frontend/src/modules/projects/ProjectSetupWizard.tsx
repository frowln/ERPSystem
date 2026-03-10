import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea, Checkbox } from '@/design-system/components/FormField';
import { permissionsApi } from '@/api/permissions';
import toast from 'react-hot-toast';
import { t } from '@/i18n';

interface ProjectSetupWizardProps {
  open: boolean;
  onClose: () => void;
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
}

interface BudgetLine {
  category: string;
  amount: string;
}

const getProjectTypeOptions = () => [
  { value: 'RESIDENTIAL', label: t('projects.types.residential') },
  { value: 'COMMERCIAL', label: t('projects.types.commercial') },
  { value: 'INDUSTRIAL', label: t('projects.types.industrial') },
  { value: 'INFRASTRUCTURE', label: t('projects.types.infrastructure') },
  { value: 'RENOVATION', label: t('projects.types.renovation') },
];


const getRoleOptions = () => [
  { value: 'pm', label: t('projects.wizard.rolePm') },
  { value: 'engineer', label: t('projects.wizard.roleEngineer') },
  { value: 'foreman', label: t('projects.wizard.roleForeman') },
  { value: 'estimator', label: t('projects.wizard.roleEstimator') },
  { value: 'SAFETY', label: t('projects.wizard.roleSafety') },
  { value: 'SUPPLY', label: t('projects.wizard.roleSupply') },
  { value: 'accountant', label: t('projects.wizard.roleAccountant') },
];

const getBudgetCategories = () => [
  t('projects.wizard.budgetMaterials'),
  t('projects.wizard.budgetOwnWorks'),
  t('projects.wizard.budgetSubcontract'),
  t('projects.wizard.budgetMachinery'),
  t('projects.wizard.budgetOverhead'),
  t('projects.wizard.budgetPayroll'),
  t('projects.wizard.budgetDesign'),
  t('projects.wizard.budgetOther'),
];

const getDefaultFolders = () => [
  t('projects.wizard.folderProjectDocs'),
  t('projects.wizard.folderWorkingDocs'),
  t('projects.wizard.folderPermits'),
  t('projects.wizard.folderActsForms'),
  t('projects.wizard.folderCorrespondence'),
  t('projects.wizard.folderPhotoReports'),
  t('projects.wizard.folderAsBuiltDocs'),
];

const getSteps = () => [
  t('projects.wizard.stepBasicData'),
  t('projects.wizard.stepTeam'),
  t('projects.wizard.stepBudget'),
  t('projects.wizard.stepDocuments'),
  t('projects.wizard.stepConfirmation'),
] as const;

export const ProjectSetupWizard: React.FC<ProjectSetupWizardProps> = ({ open, onClose }) => {
  const projectTypeOptions = getProjectTypeOptions();
  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: () => permissionsApi.getUsers() });
  const userOptions = (usersData?.content ?? []).map((u) => ({ value: u.id, label: u.fullName ?? u.email }));
  const roleOptions = getRoleOptions();
  const budgetCategories = getBudgetCategories();
  const defaultFolders = getDefaultFolders();
  const STEPS = getSteps();

  const [step, setStep] = useState(0);
  // Step 1
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [projectType, setProjectType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  // Step 2
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('');
  // Step 3
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>(
    budgetCategories.map((cat) => ({ category: cat, amount: '' }))
  );
  // Step 4
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set(defaultFolders));

  const [submitting, setSubmitting] = useState(false);

  const addMember = () => {
    if (!newUserId || !newRole) return;
    if (members.some((m) => m.userId === newUserId)) return;
    setMembers((prev) => [...prev, { id: `m-${Date.now()}`, userId: newUserId, role: newRole }]);
    setNewUserId('');
    setNewRole('');
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateBudget = (index: number, amount: string) => {
    setBudgetLines((prev) => prev.map((b, i) => (i === index ? { ...b, amount } : b)));
  };

  const toggleFolder = (folder: string) => {
    setSelectedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const totalBudget = budgetLines.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

  const handleFinish = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success(t('projects.wizard.projectCreated', { name }));
    setSubmitting(false);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setName('');
    setCode('');
    setProjectType('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setMembers([]);
    setNewUserId('');
    setNewRole('');
    setBudgetLines(budgetCategories.map((cat) => ({ category: cat, amount: '' })));
    setSelectedFolders(new Set(defaultFolders));
    onClose();
  };

  const canNext =
    step === 0
      ? name !== '' && code !== '' && projectType !== '' && startDate !== ''
      : step === 1
        ? members.length > 0
        : true;

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title={t('projects.wizard.title')}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={step === 0 ? resetAndClose : () => setStep(step - 1)}>
            {step === 0 ? t('common.cancel') : t('common.back')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              {t('common.next')}
            </Button>
          ) : (
            <Button onClick={handleFinish} loading={submitting}>
              {t('projects.createProject')}
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

      {/* Step 1: Basic info */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('projects.projectName')} required>
              <Input placeholder={t('projects.wizard.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <FormField label={t('projects.projectCode')} required>
              <Input placeholder={t('projects.wizard.codePlaceholder')} value={code} onChange={(e) => setCode(e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('projects.projectType')} required>
            <Select
              options={projectTypeOptions}
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder={t('projects.wizard.selectType')}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('projects.startDate')} required>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FormField>
            <FormField label={t('projects.endDate')}>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('common.description')}>
            <Textarea
              placeholder={t('projects.wizard.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </FormField>
        </div>
      )}

      {/* Step 2: Team */}
      {step === 1 && (
        <div className="space-y-4">
          {members.length > 0 && (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{userOptions.find((u) => u.value === m.userId)?.label}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{roleOptions.find((r) => r.value === m.role)?.label}</p>
                  </div>
                  <button onClick={() => removeMember(m.id)} className="text-xs text-danger-600 hover:underline">
                    {t('common.delete')}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField label={t('projects.wizard.employee')}>
                <Select
                  options={userOptions}
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder={t('common.select')}
                />
              </FormField>
              <FormField label={t('projects.wizard.role')}>
                <Select
                  options={roleOptions}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder={t('common.select')}
                />
              </FormField>
            </div>
            <Button variant="secondary" size="sm" onClick={addMember} disabled={!newUserId || !newRole} className="mt-2">
              {t('projects.wizard.addMember')}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Budget */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('projects.wizard.budgetHint')}</p>
          <div className="space-y-2">
            {budgetLines.map((line, idx) => (
              <div key={line.category} className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2">
                <span className="text-sm flex-1">{line.category}</span>
                <Input
                  type="number"
                  className="w-40 text-right"
                  placeholder="0"
                  value={line.amount}
                  onChange={(e) => updateBudget(idx, e.target.value)}
                />
                <span className="text-xs text-neutral-500 dark:text-neutral-400 w-6">₽</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end bg-neutral-100 dark:bg-neutral-800 rounded-lg px-4 py-2">
            <span className="text-sm font-semibold">{t('projects.wizard.budgetTotal')}: {totalBudget.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>
      )}

      {/* Step 4: Documents */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('projects.wizard.foldersHint')}</p>
          <div className="space-y-2">
            {defaultFolders.map((folder) => (
              <label
                key={folder}
                className={`flex items-center gap-3 border rounded-lg px-4 py-2.5 cursor-pointer transition-colors ${
                  selectedFolders.has(folder) ? 'border-primary-400 bg-primary-50' : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                <Checkbox
                  checked={selectedFolders.has(folder)}
                  onChange={() => toggleFolder(folder)}
                />
                <span className="text-sm">{folder}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Review & Create */}
      {step === 4 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">{t('projects.wizard.reviewHint')}</p>
          <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <p><strong>{t('projects.name')}:</strong> {name}</p>
              <p><strong>{t('projects.code')}:</strong> {code}</p>
              <p><strong>{t('projects.type')}:</strong> {projectTypeOptions.find((pt) => pt.value === projectType)?.label}</p>
              <p><strong>{t('projects.wizard.start')}:</strong> {startDate}</p>
              {endDate && <p><strong>{t('projects.wizard.end')}:</strong> {endDate}</p>}
            </div>
            <div>
              <p><strong>{t('projects.team')}:</strong> {members.length} {t('projects.wizard.membersCount')}</p>
              <ul className="ml-4 mt-1 space-y-0.5 text-neutral-600">
                {members.map((m) => (
                  <li key={m.id}>
                    {userOptions.find((u) => u.value === m.userId)?.label} - {roleOptions.find((r) => r.value === m.role)?.label}
                  </li>
                ))}
              </ul>
            </div>
            <p><strong>{t('projects.budgetLabel')}:</strong> {totalBudget.toLocaleString('ru-RU')} ₽</p>
            <p><strong>{t('projects.wizard.docFolders')}:</strong> {selectedFolders.size} {t('projects.wizard.outOf')} {defaultFolders.length}</p>
          </div>
          <div className="bg-success-50 border border-success-200 rounded-lg p-3">
            <p className="text-sm text-success-800">
              {t('projects.wizard.confirmMessage')}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};
