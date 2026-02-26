import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Textarea, Select } from '@/design-system/components/FormField';
import { monteCarloApi } from './api';
import { t } from '@/i18n';
import type { SimulationTask } from './types';

const schema = z.object({
  name: z.string().min(1, t('forms.simulation.validation.nameRequired')).max(300),
  description: z.string().max(2000).optional(),
  projectId: z.string().optional(),
  iterations: z.string().transform((v) => Number(v) || 10000),
  confidenceLevel: z.string().transform((v) => Number(v) || 85),
});

type FormData = z.input<typeof schema>;

const confidenceOptions = [
  { value: '80', label: '80%' },
  { value: '85', label: '85%' },
  { value: '90', label: '90%' },
  { value: '95', label: '95%' },
  { value: '99', label: '99%' },
];

const SimulationFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const { data: projectsData } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.getProjects() });
  const projectOptions = [
    { value: '', label: t('forms.simulation.noProject') },
    ...(projectsData?.content ?? []).map((p) => ({ value: p.id, label: p.name })),
  ];

  const { data: existing } = useQuery({
    queryKey: ['monte-carlo', id],
    queryFn: () => monteCarloApi.getById(id!),
    enabled: isEdit,
  });

  const [tasks, setTasks] = useState<SimulationTask[]>(
    existing?.tasks ?? [
      { id: 'new-1', name: '', optimisticDuration: 0, mostLikelyDuration: 0, pessimisticDuration: 0, unit: 'DAYS' },
    ],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
          name: existing.name,
          description: existing.description ?? '',
          projectId: existing.projectId ?? '',
          iterations: String(existing.iterations),
          confidenceLevel: String(existing.confidenceLevel),
        }
      : {
          name: '',
          description: '',
          projectId: '',
          iterations: '10000',
          confidenceLevel: '85',
        },
  });

  const addTask = () => {
    setTasks((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name: '', optimisticDuration: 0, mostLikelyDuration: 0, pessimisticDuration: 0, unit: 'DAYS' },
    ]);
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const updateTask = (taskId: string, field: keyof SimulationTask, value: string | number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, [field]: value } : t,
      ),
    );
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      monteCarloApi.create({ ...(data as any), tasks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monte-carlo'] });
      toast.success(t('forms.simulation.createSuccess'));
      navigate('/monte-carlo');
    },
    onError: () => toast.error(t('forms.simulation.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      monteCarloApi.update(id!, { ...(data as any), tasks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monte-carlo'] });
      queryClient.invalidateQueries({ queryKey: ['monte-carlo', id] });
      toast.success(t('forms.simulation.updateSuccess'));
      navigate(`/monte-carlo/${id}`);
    },
    onError: () => toast.error(t('forms.simulation.updateError')),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={isEdit ? t('forms.simulation.editTitle') : t('forms.simulation.createTitle')}
        subtitle={isEdit ? existing?.name : t('forms.simulation.createSubtitle')}
        backTo={isEdit ? `/monte-carlo/${id}` : '/monte-carlo'}
        breadcrumbs={[
          { label: t('forms.common.home'), href: '/' },
          { label: t('forms.simulation.breadcrumbMonteCarlo'), href: '/monte-carlo' },
          { label: isEdit ? t('forms.common.editing') : t('forms.common.creating') },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.simulation.sectionParams')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label={t('forms.simulation.labelName')} error={errors.name?.message} required className="sm:col-span-2">
              <Input placeholder={t('forms.simulation.placeholderName')} hasError={!!errors.name} {...register('name')} />
            </FormField>
            <FormField label={t('forms.simulation.labelProject')} error={errors.projectId?.message}>
              <Select options={projectOptions} hasError={!!errors.projectId} {...register('projectId')} />
            </FormField>
            <FormField label={t('forms.simulation.labelIterations')} error={errors.iterations?.message}>
              <Input type="text" inputMode="numeric" placeholder="10000" hasError={!!errors.iterations} {...register('iterations')} />
            </FormField>
            <FormField label={t('forms.simulation.labelConfidenceLevel')} error={errors.confidenceLevel?.message}>
              <Select options={confidenceOptions} hasError={!!errors.confidenceLevel} {...register('confidenceLevel')} />
            </FormField>
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('forms.simulation.sectionTasks')} ({tasks.length})</h2>
            <Button type="button" variant="secondary" size="sm" iconLeft={<Plus size={14} />} onClick={addTask}>
              {t('forms.simulation.addTask')}
            </Button>
          </div>

          <div className="space-y-4">
            {tasks.map((task, idx) => (
              <div key={task.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{t('forms.simulation.taskLabel')} {idx + 1}</span>
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="p-1 text-neutral-400 hover:text-danger-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <FormField label={t('forms.simulation.labelTaskName')} className="sm:col-span-4">
                    <Input
                      placeholder={t('forms.simulation.placeholderTaskName')}
                      value={task.name}
                      onChange={(e) => updateTask(task.id, 'name', e.target.value)}
                    />
                  </FormField>
                  <FormField label={t('forms.simulation.labelOptimistic')}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="20"
                      value={task.optimisticDuration || ''}
                      onChange={(e) => updateTask(task.id, 'optimisticDuration', Number(e.target.value) || 0)}
                    />
                  </FormField>
                  <FormField label={t('forms.simulation.labelMostLikely')}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="30"
                      value={task.mostLikelyDuration || ''}
                      onChange={(e) => updateTask(task.id, 'mostLikelyDuration', Number(e.target.value) || 0)}
                    />
                  </FormField>
                  <FormField label={t('forms.simulation.labelPessimistic')}>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="45"
                      value={task.pessimisticDuration || ''}
                      onChange={(e) => updateTask(task.id, 'pessimisticDuration', Number(e.target.value) || 0)}
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 mb-8">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-5">{t('forms.simulation.sectionDescription')}</h2>
          <FormField label={t('forms.simulation.labelDescription')} error={errors.description?.message}>
            <Textarea
              placeholder={t('forms.simulation.placeholderDescription')}
              rows={4}
              hasError={!!errors.description}
              {...register('description')}
            />
          </FormField>
        </section>

        <div className="flex items-center gap-3">
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? t('forms.common.saveChanges') : t('forms.simulation.createButton')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(isEdit ? `/monte-carlo/${id}` : '/monte-carlo')}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SimulationFormPage;
