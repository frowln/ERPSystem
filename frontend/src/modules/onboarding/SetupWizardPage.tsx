import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  FolderPlus,
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select, Textarea } from '@/design-system/components/FormField';
import { onboardingApi } from '@/api/onboarding';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n';
import { cn } from '@/lib/cn';
import toast from 'react-hot-toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamMember {
  id: string;
  email: string;
  role: string;
}

interface CompanyData {
  name: string;
  inn: string;
  address: string;
  phone: string;
  industry: string;
}

interface ProjectData {
  name: string;
  description: string;
  startDate: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 3;

const getIndustryOptions = () => [
  { value: 'residential', label: t('setup.industryResidential') },
  { value: 'commercial', label: t('setup.industryCommercial') },
  { value: 'industrial', label: t('setup.industryIndustrial') },
  { value: 'infrastructure', label: t('setup.industryInfrastructure') },
  { value: 'energy', label: t('setup.industryEnergy') },
  { value: 'other', label: t('setup.industryOther') },
];

const getRoleOptions = () => [
  { value: 'MANAGER', label: t('setup.roleManager') },
  { value: 'ENGINEER', label: t('setup.roleEngineer') },
  { value: 'ACCOUNTANT', label: t('setup.roleAccountant') },
  { value: 'VIEWER', label: t('setup.roleViewer') },
];

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

interface StepIndicatorProps {
  currentStep: number;
}

const stepMeta = () => [
  { icon: Building2, label: t('setup.step1Title') },
  { icon: Users, label: t('setup.step2Title') },
  { icon: FolderPlus, label: t('setup.step3Title') },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = stepMeta();
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <div
                className={cn(
                  'hidden sm:block w-10 h-0.5 rounded-full transition-colors',
                  isCompleted ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700',
                )}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-colors text-sm font-medium',
                  isCompleted && 'bg-primary-500 text-white',
                  isActive && 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500',
                  !isActive && !isCompleted && 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500',
                )}
              >
                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
              </div>
              <span
                className={cn(
                  'hidden md:inline text-sm font-medium transition-colors',
                  isActive ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-400 dark:text-neutral-500',
                )}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 1 — Company info
// ---------------------------------------------------------------------------

interface Step1Props {
  data: CompanyData;
  onChange: (data: CompanyData) => void;
}

const Step1CompanyInfo: React.FC<Step1Props> = ({ data, onChange }) => {
  const update = (field: keyof CompanyData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t('setup.step1Title')}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {t('setup.step1Desc')}
        </p>
      </div>

      <FormField label={t('setup.companyName')} required>
        <Input
          value={data.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder={t('setup.companyNamePlaceholder')}
        />
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label={t('setup.inn')}>
          <Input
            value={data.inn}
            onChange={(e) => update('inn', e.target.value)}
            placeholder="1234567890"
            maxLength={12}
          />
        </FormField>
        <FormField label={t('setup.phone')}>
          <Input
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+7 (999) 123-45-67"
            type="tel"
          />
        </FormField>
      </div>

      <FormField label={t('setup.address')}>
        <Input
          value={data.address}
          onChange={(e) => update('address', e.target.value)}
          placeholder={t('setup.addressPlaceholder')}
        />
      </FormField>

      <FormField label={t('setup.industry')}>
        <Select
          value={data.industry}
          onChange={(e) => update('industry', e.target.value)}
          options={getIndustryOptions()}
          placeholder={t('setup.industryPlaceholder')}
        />
      </FormField>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 2 — Invite team
// ---------------------------------------------------------------------------

interface Step2Props {
  members: TeamMember[];
  onAdd: (email: string, role: string) => void;
  onRemove: (id: string) => void;
}

const Step2InviteTeam: React.FC<Step2Props> = ({ members, onAdd, onRemove }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ENGINEER');

  const handleAdd = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (members.some((m) => m.email === trimmed)) {
      toast.error(t('setup.emailAlreadyAdded'));
      return;
    }
    onAdd(trimmed, role);
    setEmail('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t('setup.step2Title')}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {t('setup.step2Desc')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <FormField label={t('setup.inviteEmail')}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="colleague@company.ru"
            />
          </FormField>
        </div>
        <div className="sm:w-44">
          <FormField label={t('setup.inviteRole')}>
            <Select value={role} onChange={(e) => setRole(e.target.value)} options={getRoleOptions()} />
          </FormField>
        </div>
        <div className="flex items-end">
          <Button variant="secondary" onClick={handleAdd} iconLeft={<Plus size={16} />}>
            {t('setup.addMember')}
          </Button>
        </div>
      </div>

      {members.length > 0 && (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 dark:divide-neutral-800">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{m.email}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{m.role}</p>
              </div>
              <button
                onClick={() => onRemove(m.id)}
                className="p-1.5 text-neutral-400 hover:text-danger-500 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label={t('common.delete')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {members.length === 0 && (
        <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-sm">
          {t('setup.noMembersYet')}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step 3 — First project
// ---------------------------------------------------------------------------

interface Step3Props {
  data: ProjectData;
  onChange: (data: ProjectData) => void;
}

const Step3FirstProject: React.FC<Step3Props> = ({ data, onChange }) => {
  const update = (field: keyof ProjectData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {t('setup.step3Title')}
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          {t('setup.step3Desc')}
        </p>
      </div>

      <FormField label={t('setup.projectName')} required>
        <Input
          value={data.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder={t('setup.projectNamePlaceholder')}
        />
      </FormField>

      <FormField label={t('setup.projectDesc')}>
        <Textarea
          value={data.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder={t('setup.projectDescPlaceholder')}
          rows={3}
        />
      </FormField>

      <FormField label={t('setup.startDate')}>
        <Input
          type="date"
          value={data.startDate}
          onChange={(e) => update('startDate', e.target.value)}
        />
      </FormField>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Completion screen
// ---------------------------------------------------------------------------

const CompletionScreen: React.FC<{ onGoToDashboard: () => void }> = ({ onGoToDashboard }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mx-auto mb-5">
      <Check size={32} className="text-success-600" />
    </div>
    <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
      {t('setup.complete')}
    </h2>
    <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-md mx-auto">
      {t('setup.completeDesc')}
    </p>
    <Button size="lg" onClick={onGoToDashboard} iconRight={<ArrowRight size={18} />}>
      {t('setup.goToDashboard')}
    </Button>
  </div>
);

// ---------------------------------------------------------------------------
// Main wizard page
// ---------------------------------------------------------------------------

let memberIdCounter = 0;

const SetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Step 1 state
  const [company, setCompany] = useState<CompanyData>({
    name: user?.organizationName ?? '',
    inn: '',
    address: '',
    phone: '',
    industry: '',
  });

  // Step 2 state
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Step 3 state
  const [project, setProject] = useState<ProjectData>({
    name: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 10),
  });

  const addMember = useCallback((email: string, role: string) => {
    memberIdCounter += 1;
    setMembers((prev) => [...prev, { id: `m-${memberIdCounter}`, email, role }]);
  }, []);

  const removeMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const canProceed = (): boolean => {
    if (step === 0) return company.name.trim().length > 0;
    if (step === 1) return true; // optional
    if (step === 2) return true; // optional — can skip project
    return true;
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Save organization info
      if (company.name.trim()) {
        await onboardingApi.setupOrganization({
          name: company.name.trim(),
          inn: company.inn.trim() || undefined,
          address: company.address.trim() || undefined,
          phone: company.phone.trim() || undefined,
          industry: company.industry || undefined,
        });
      }

      // 2. Invite team members
      if (members.length > 0) {
        await onboardingApi.inviteMembers({
          invitations: members.map((m) => ({ email: m.email, role: m.role })),
        });
      }

      // 3. Create first project
      if (project.name.trim()) {
        await onboardingApi.createFirstProject({
          name: project.name.trim(),
          description: project.description.trim() || undefined,
          startDate: project.startDate || undefined,
        });
      }

      toast.success(t('setup.setupSuccess'));
      setIsComplete(true);
    } catch {
      toast.error(t('setup.setupError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToDashboard = () => navigate('/', { replace: true });

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSkip = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      navigate('/', { replace: true });
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {t('setup.title')}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('setup.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
          >
            {t('setup.skip')}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-8">
        {isComplete ? (
          <div className="w-full max-w-lg">
            <CompletionScreen onGoToDashboard={goToDashboard} />
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="mb-8">
              <StepIndicator currentStep={step} />
            </div>

            {/* Step content */}
            <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm">
              {step === 0 && <Step1CompanyInfo data={company} onChange={setCompany} />}
              {step === 1 && (
                <Step2InviteTeam members={members} onAdd={addMember} onRemove={removeMember} />
              )}
              {step === 2 && <Step3FirstProject data={project} onChange={setProject} />}
            </div>

            {/* Navigation buttons */}
            <div className="w-full max-w-lg mt-6 flex items-center justify-between">
              <div>
                {step > 0 && (
                  <Button variant="ghost" onClick={handleBack} iconLeft={<ArrowLeft size={16} />}>
                    {t('setup.back')}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {step > 0 && (
                  <Button variant="ghost" onClick={handleSkip}>
                    {t('setup.skipStep')}
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  loading={isSubmitting}
                  iconRight={
                    step < TOTAL_STEPS - 1 ? <ArrowRight size={16} /> : <Check size={16} />
                  }
                >
                  {step < TOTAL_STEPS - 1 ? t('setup.next') : t('setup.finish')}
                </Button>
              </div>
            </div>

            {/* Step counter */}
            <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
              {t('setup.stepOf', { current: String(step + 1), total: String(TOTAL_STEPS) })}
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default SetupWizardPage;
