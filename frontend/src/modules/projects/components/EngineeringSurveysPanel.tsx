import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Mountain, Droplets, Leaf, Plus, Pencil } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Modal } from '@/design-system/components/Modal';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { surveysApi } from '@/api/surveys';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { EngineeringSurvey, SurveyType, SurveyStatus } from '@/types';

const SURVEY_TYPE_ICONS: Record<SurveyType, React.ReactNode> = {
  GEODETIC: <MapPin size={16} />,
  GEOLOGICAL: <Mountain size={16} />,
  HYDRO: <Droplets size={16} />,
  ECOLOGICAL: <Leaf size={16} />,
  OTHER: <MapPin size={16} />,
};

const STATUS_COLORS: Record<SurveyStatus, string> = {
  PLANNED: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const SURVEY_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'GEODETIC', label: t('projects.surveys.types.GEODETIC') },
  { value: 'GEOLOGICAL', label: t('projects.surveys.types.GEOLOGICAL') },
  { value: 'HYDRO', label: t('projects.surveys.types.HYDRO') },
  { value: 'ECOLOGICAL', label: t('projects.surveys.types.ECOLOGICAL') },
  { value: 'OTHER', label: t('projects.surveys.types.OTHER') },
];

const SURVEY_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'PLANNED', label: t('projects.surveys.statuses.PLANNED') },
  { value: 'IN_PROGRESS', label: t('projects.surveys.statuses.IN_PROGRESS') },
  { value: 'COMPLETED', label: t('projects.surveys.statuses.COMPLETED') },
  { value: 'APPROVED', label: t('projects.surveys.statuses.APPROVED') },
];

const EngineeringSurveysPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EngineeringSurvey | null>(null);
  const [form, setForm] = useState<Partial<EngineeringSurvey>>({ type: 'GEODETIC', status: 'PLANNED' });

  const { data: surveys = [] } = useQuery({
    queryKey: ['surveys', projectId],
    queryFn: () => surveysApi.getSurveys(projectId),
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<EngineeringSurvey>) =>
      editing
        ? surveysApi.updateSurvey(projectId, editing.id, data)
        : surveysApi.createSurvey(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys', projectId] });
      setModalOpen(false);
      setEditing(null);
      toast.success(t('common.saved'));
    },
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ type: 'GEODETIC', status: 'PLANNED' });
    setModalOpen(true);
  };

  const openEdit = (survey: EngineeringSurvey) => {
    setEditing(survey);
    setForm(survey);
    setModalOpen(true);
  };

  const mandatoryTypes: SurveyType[] = ['GEODETIC', 'GEOLOGICAL', 'HYDRO', 'ECOLOGICAL'];
  const surveyByType = new Map(surveys.map(s => [s.type, s]));

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {t('projects.surveys.title')}
        </h3>
        <Button size="sm" variant="ghost" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> {t('common.add')}
        </Button>
      </div>

      <div className="space-y-2">
        {mandatoryTypes.map(type => {
          const survey = surveyByType.get(type);
          const status = survey?.status ?? 'PLANNED';
          return (
            <div
              key={type}
              className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-neutral-500 dark:text-neutral-400">{SURVEY_TYPE_ICONS[type]}</span>
                <div>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {t(`projects.surveys.types.${type}`)}
                  </p>
                  {survey?.contractor && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{survey.contractor}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
                  {t(`projects.surveys.statuses.${status}`)}
                </span>
                {survey && (
                  <button
                    onClick={() => openEdit(survey)}
                    className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {surveys.filter(s => !mandatoryTypes.includes(s.type)).map(survey => (
          <div
            key={survey.id}
            className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-neutral-500 dark:text-neutral-400">{SURVEY_TYPE_ICONS[survey.type]}</span>
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {survey.resultSummary ?? t(`projects.surveys.types.${survey.type}`)}
                </p>
                {survey.contractor && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{survey.contractor}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[survey.status]}`}>
                {t(`projects.surveys.statuses.${survey.status}`)}
              </span>
              <button
                onClick={() => openEdit(survey)}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"
              >
                <Pencil size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('projects.surveys.editTitle') : t('projects.surveys.addTitle')}>
        <div className="space-y-4">
          <FormField label={t('projects.surveys.type')}>
            <Select options={SURVEY_TYPE_OPTIONS} value={form.type ?? ''} onChange={e => setForm(f => ({ ...f, type: e.target.value as SurveyType }))} />
          </FormField>
          <FormField label={t('common.status')}>
            <Select options={SURVEY_STATUS_OPTIONS} value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value as SurveyStatus }))} />
          </FormField>
          <FormField label={t('projects.surveys.contractor')}>
            <Input value={form.contractor ?? ''} onChange={e => setForm(f => ({ ...f, contractor: e.target.value }))} />
          </FormField>
          <FormField label={t('projects.surveys.contractNumber')}>
            <Input value={form.contractNumber ?? ''} onChange={e => setForm(f => ({ ...f, contractNumber: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('projects.surveys.startDate')}>
              <Input type="date" value={form.startDate ?? ''} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </FormField>
            <FormField label={t('projects.surveys.endDate')}>
              <Input type="date" value={form.endDate ?? ''} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </FormField>
          </div>
          <FormField label={t('projects.surveys.resultSummary')}>
            <Input value={form.resultSummary ?? ''} onChange={e => setForm(f => ({ ...f, resultSummary: e.target.value }))} />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EngineeringSurveysPanel;
