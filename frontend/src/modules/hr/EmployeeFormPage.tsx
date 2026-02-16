import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { hrApi } from '@/api/hr';
import { t } from '@/i18n';

const employeeSchema = z.object({
  firstName: z.string().min(1, t('forms.employee.validation.firstNameRequired')).max(255, t('forms.common.maxChars', { count: '255' })),
  lastName: z.string().min(1, t('forms.employee.validation.lastNameRequired')).max(255, t('forms.common.maxChars', { count: '255' })),
  middleName: z.string().max(255, t('forms.common.maxChars', { count: '255' })).optional(),
  position: z.string().min(1, t('forms.employee.validation.positionRequired')).max(200, t('forms.common.maxChars', { count: '200' })),
  departmentId: z.string().min(1, t('forms.employee.validation.departmentRequired')),
  projectId: z.string().optional(),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d+\-() ]+$/.test(val),
      t('forms.employee.validation.phoneInvalid'),
    ),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      t('forms.employee.validation.emailInvalid'),
    ),
  hireDate: z.string().min(1, t('forms.employee.validation.hireDateRequired')),
  contractType: z.string().min(1, t('forms.employee.validation.contractTypeRequired')),
  passportNumber: z.string().max(20, t('forms.common.maxChars', { count: '20' })).optional(),
  inn: z.string().max(12, t('forms.common.maxChars', { count: '12' })).optional(),
  snils: z.string().max(14, t('forms.common.maxChars', { count: '14' })).optional(),
  hourlyRate: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  monthlyRate: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  notes: z.string().max(2000, t('forms.common.maxChars', { count: '2000' })).optional(),
});

type EmployeeFormData = z.input<typeof employeeSchema>;

const departmentOptions = [
  { value: 'd1', label: t('forms.employee.departments.construction') },
  { value: 'd2', label: t('forms.employee.departments.design') },
  { value: 'd3', label: t('forms.employee.departments.supply') },
  { value: 'd4', label: t('forms.employee.departments.pto') },
  { value: 'd5', label: t('forms.employee.departments.finance') },
  { value: 'd6', label: t('forms.employee.departments.legal') },
  { value: 'd7', label: t('forms.employee.departments.hr') },
  { value: 'd8', label: t('forms.employee.departments.it') },
];

const projectOptions = [
  { value: '', label: t('forms.employee.noProject') },
  { value: '1', label: t('mockData.projectSolnechny') },
  { value: '2', label: t('mockData.projectGorizont') },
  { value: '3', label: t('mockData.projectBridgeVyatka') },
  { value: '6', label: t('mockData.projectTsCentralny') },
];

const contractTypeOptions = [
  { value: 'PERMANENT', label: t('forms.employee.contractTypes.permanent') },
  { value: 'FIXED_TERM', label: t('forms.employee.contractTypes.fixedTerm') },
  { value: 'CIVIL', label: t('forms.employee.contractTypes.civil') },
  { value: 'PART_TIME', label: t('forms.employee.contractTypes.partTime') },
  { value: 'probation', label: t('forms.employee.contractTypes.probation') },
];

const EmployeeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      position: '',
      departmentId: '',
      projectId: '',
      phone: '',
      email: '',
      hireDate: '',
      contractType: '',
      passportNumber: '',
      inn: '',
      snils: '',
      hourlyRate: '',
      monthlyRate: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: EmployeeFormData) => {
      const parsed = employeeSchema.parse(data);
      const fullName = [parsed.lastName, parsed.firstName, parsed.middleName].filter(Boolean).join(' ');
      return hrApi.createEmployee({
        fullName,
        position: parsed.position,
        hireDate: parsed.hireDate,
        phone: parsed.phone || undefined,
        email: parsed.email || undefined,
        status: 'ACTIVE',
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['EMPLOYEES'] });
      toast.success(t('forms.employee.createSuccess'));
      navigate('/employees');
    },
    onError: () => {
      toast.error(t('forms.employee.createError'));
    },
  });

  const onSubmit = (data: EmployeeFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('forms.employee.createTitle')}
        subtitle={t('forms.employee.createSubtitle')}
        backTo="/employees"
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.employee.breadcrumbEmployees'), href: '/employees' },
          { label: t('forms.employee.breadcrumbAdding') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.employee.sectionPersonal')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.employee.labelLastName')} error={errors.lastName?.message} required>
              <Input placeholder={t('forms.employee.placeholderLastName')} hasError={!!errors.lastName} {...register('lastName')} />
            </FormField>
            <FormField label={t('forms.employee.labelFirstName')} error={errors.firstName?.message} required>
              <Input placeholder={t('forms.employee.placeholderFirstName')} hasError={!!errors.firstName} {...register('firstName')} />
            </FormField>
            <FormField label={t('forms.employee.labelMiddleName')} error={errors.middleName?.message}>
              <Input placeholder={t('forms.employee.placeholderMiddleName')} hasError={!!errors.middleName} {...register('middleName')} />
            </FormField>
            <FormField label={t('forms.employee.labelPosition')} error={errors.position?.message} required>
              <Input placeholder={t('forms.employee.placeholderPosition')} hasError={!!errors.position} {...register('position')} />
            </FormField>
            <FormField label={t('forms.employee.labelDepartment')} error={errors.departmentId?.message} required>
              <Select
                options={departmentOptions}
                placeholder={t('forms.employee.placeholderDepartment')}
                hasError={!!errors.departmentId}
                {...register('departmentId')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.employee.sectionContacts')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.employee.labelPhone')} error={errors.phone?.message}>
              <Input placeholder="+7 (999) 123-45-67" hasError={!!errors.phone} {...register('phone')} />
            </FormField>
            <FormField label={t('forms.employee.labelEmail')} error={errors.email?.message}>
              <Input
                type="email"
                placeholder="ivanov@company.ru"
                hasError={!!errors.email}
                {...register('email')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.employee.sectionEmployment')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.employee.labelHireDate')} error={errors.hireDate?.message} required>
              <Input type="date" hasError={!!errors.hireDate} {...register('hireDate')} />
            </FormField>
            <FormField label={t('forms.employee.labelContractType')} error={errors.contractType?.message} required>
              <Select
                options={contractTypeOptions}
                placeholder={t('forms.employee.placeholderContractType')}
                hasError={!!errors.contractType}
                {...register('contractType')}
              />
            </FormField>
            <FormField label={t('forms.employee.labelProject')} error={errors.projectId?.message}>
              <Select
                options={projectOptions}
                placeholder={t('forms.employee.placeholderProject')}
                hasError={!!errors.projectId}
                {...register('projectId')}
              />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.employee.sectionDocuments')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FormField label={t('forms.employee.labelPassport')} error={errors.passportNumber?.message}>
              <Input placeholder="4510 123456" hasError={!!errors.passportNumber} {...register('passportNumber')} />
            </FormField>
            <FormField label={t('forms.employee.labelInn')} error={errors.inn?.message}>
              <Input placeholder="123456789012" hasError={!!errors.inn} {...register('inn')} />
            </FormField>
            <FormField label={t('forms.employee.labelSnils')} error={errors.snils?.message}>
              <Input placeholder="123-456-789 01" hasError={!!errors.snils} {...register('snils')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.employee.sectionPayNotes')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.employee.labelHourlyRate')} error={errors.hourlyRate?.message}>
              <Input type="text" inputMode="numeric" placeholder="500" hasError={!!errors.hourlyRate} {...register('hourlyRate')} />
            </FormField>
            <FormField label={t('forms.employee.labelMonthlyRate')} error={errors.monthlyRate?.message}>
              <Input type="text" inputMode="numeric" placeholder="80000" hasError={!!errors.monthlyRate} {...register('monthlyRate')} />
            </FormField>
          </div>
          <div className="mt-5">
            <FormField label={t('forms.employee.labelNotes')} error={errors.notes?.message}>
              <Textarea placeholder={t('forms.employee.placeholderNotes')} rows={3} hasError={!!errors.notes} {...register('notes')} />
            </FormField>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={createMutation.isPending}>
            {t('forms.employee.createButton')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeFormPage;
