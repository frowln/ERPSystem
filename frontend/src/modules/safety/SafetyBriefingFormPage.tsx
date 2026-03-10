import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { FormField, Input, Select } from '@/design-system/components/FormField';
import { safetyBriefingApi } from '@/api/safetyBriefings';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { BriefingType, CreateBriefingRequest } from './types';

const SafetyBriefingFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [briefingType, setBriefingType] = useState<BriefingType>('INITIAL');
  const [briefingDate, setBriefingDate] = useState('');
  const [instructorName, setInstructorName] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [attendees, setAttendees] = useState<{ employeeId: string; employeeName: string }[]>([]);
  const [newAttendeeName, setNewAttendeeName] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: CreateBriefingRequest) => safetyBriefingApi.createBriefing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safety-briefings'] });
      toast.success(t('safety.briefings.toastCreated'));
      navigate('/safety/briefings');
    },
    onError: () => {
      toast.error(t('safety.briefings.toastCreateError'));
    },
  });

  const typeOptions = [
    { value: 'INITIAL', label: t('safety.briefings.typeInitial') },
    { value: 'PRIMARY', label: t('safety.briefings.typePrimary') },
    { value: 'REPEAT', label: t('safety.briefings.typeRepeat') },
    { value: 'UNSCHEDULED', label: t('safety.briefings.typeUnscheduled') },
    { value: 'TARGET', label: t('safety.briefings.typeTarget') },
  ];

  const addAttendee = () => {
    if (!newAttendeeName.trim()) return;
    setAttendees((prev) => [
      ...prev,
      { employeeId: crypto.randomUUID(), employeeName: newAttendeeName.trim() },
    ]);
    setNewAttendeeName('');
  };

  const removeAttendee = (index: number) => {
    setAttendees((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    createMutation.mutate({
      briefingType,
      briefingDate,
      instructorName,
      topic,
      notes,
      attendees,
    });
  };

  const isValid = briefingDate && instructorName.trim() && topic.trim();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={t('safety.briefings.formTitle')}
        subtitle={t('safety.briefings.formSubtitle')}
        breadcrumbs={[
          { label: t('common.home'), href: '/' },
          { label: t('safety.title'), href: '/safety' },
          { label: t('safety.briefings.breadcrumbBriefings'), href: '/safety/briefings' },
          { label: t('safety.briefings.formTitle') },
        ]}
      />

      <div className="max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('safety.briefings.labelType')} required>
            <Select
              options={typeOptions}
              value={briefingType}
              onChange={(e) => setBriefingType(e.target.value as BriefingType)}
            />
          </FormField>
          <FormField label={t('safety.briefings.labelDate')} required>
            <Input
              type="date"
              value={briefingDate}
              onChange={(e) => setBriefingDate(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label={t('safety.briefings.labelInstructor')} required>
          <Input
            placeholder={t('safety.briefings.placeholderInstructor')}
            value={instructorName}
            onChange={(e) => setInstructorName(e.target.value)}
          />
        </FormField>

        <FormField label={t('safety.briefings.labelTopic')} required>
          <Input
            placeholder={t('safety.briefings.placeholderTopic')}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </FormField>

        <FormField label={t('safety.briefings.labelNotes')}>
          <textarea
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder={t('safety.briefings.placeholderNotes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FormField>

        {/* Attendees */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            {t('safety.briefings.sectionAttendees')} ({attendees.length})
          </h3>

          {attendees.length > 0 && (
            <div className="space-y-2 mb-3">
              {attendees.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-800 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-neutral-800 dark:text-neutral-200">{a.employeeName}</span>
                  <button
                    onClick={() => removeAttendee(i)}
                    className="text-neutral-400 hover:text-danger-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              placeholder={t('safety.briefings.placeholderAttendeeName')}
              value={newAttendeeName}
              onChange={(e) => setNewAttendeeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={addAttendee} iconLeft={<Plus size={14} />}>
              {t('safety.briefings.btnAddAttendee')}
            </Button>
          </div>
        </div>

        {briefingType === 'REPEAT' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {t('safety.briefings.repeatHint')}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-neutral-200 dark:border-neutral-700">
          <Button variant="outline" onClick={() => navigate('/safety/briefings')}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={createMutation.isPending}
            disabled={!isValid}
            iconLeft={<ClipboardCheck size={16} />}
          >
            {t('safety.briefings.btnCreate')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SafetyBriefingFormPage;
