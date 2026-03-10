import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Calendar, MapPin, CheckSquare, Square, Plus, Trash2, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/design-system/components/PageHeader';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/FormField';
import { meetingsApi } from '@/api/meetings';
import { t } from '@/i18n';
import toast from 'react-hot-toast';
import type { PreConstructionMeeting } from '@/types';

const PreConstructionMeetingPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [newAttendee, setNewAttendee] = useState('');
  const [newAgenda, setNewAgenda] = useState('');
  const [newDecision, setNewDecision] = useState('');
  const [newAction, setNewAction] = useState({ description: '', owner: '', dueDate: '' });

  const { data: meeting } = useQuery({
    queryKey: ['meeting', projectId],
    queryFn: () => meetingsApi.getMeeting(projectId!),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      meetingsApi.createMeeting(projectId!, {
        date: new Date().toISOString().slice(0, 10),
        attendees: [],
        agenda: [],
        decisions: [],
        actionItems: [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', projectId] });
      toast.success(t('common.saved'));
    },
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PreConstructionMeeting>) => meetingsApi.updateMeeting(projectId!, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting', projectId] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const toggleDecision = useMutation({
    mutationFn: (decisionId: string) => meetingsApi.toggleDecision(projectId!, decisionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting', projectId] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  const toggleAction = useMutation({
    mutationFn: (actionId: string) => meetingsApi.toggleActionItem(projectId!, actionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting', projectId] }),
    onError: () => {
      toast.error(t('common.operationError'));
    },
  });

  if (!meeting) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('projects.meeting.title')} subtitle={t('projects.meeting.subtitle')} backTo={`/projects/${projectId}?tab=preConstruction`} />
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-12 text-center">
          <ClipboardList size={48} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">{t('projects.meeting.empty')}</p>
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            <Plus size={16} className="mr-1.5" /> {t('projects.meeting.create')}
          </Button>
        </div>
      </div>
    );
  }

  const addAttendee = () => {
    if (!newAttendee.trim()) return;
    updateMutation.mutate({ attendees: [...meeting.attendees, newAttendee.trim()] });
    setNewAttendee('');
  };

  const removeAttendee = (idx: number) => {
    updateMutation.mutate({ attendees: meeting.attendees.filter((_, i) => i !== idx) });
  };

  const addAgenda = () => {
    if (!newAgenda.trim()) return;
    updateMutation.mutate({ agenda: [...meeting.agenda, newAgenda.trim()] });
    setNewAgenda('');
  };

  const removeAgenda = (idx: number) => {
    updateMutation.mutate({ agenda: meeting.agenda.filter((_, i) => i !== idx) });
  };

  const addDecision = () => {
    if (!newDecision.trim()) return;
    const decision = { id: crypto.randomUUID(), text: newDecision.trim(), completed: false };
    updateMutation.mutate({ decisions: [...meeting.decisions, decision] });
    setNewDecision('');
  };

  const addActionItem = () => {
    if (!newAction.description.trim()) return;
    const item = { id: crypto.randomUUID(), ...newAction, completed: false };
    updateMutation.mutate({ actionItems: [...meeting.actionItems, item] });
    setNewAction({ description: '', owner: '', dueDate: '' });
  };

  const decisionsCompleted = meeting.decisions.filter(d => d.completed).length;
  const actionsCompleted = meeting.actionItems.filter(a => a.completed).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('projects.meeting.title')}
        subtitle={t('projects.meeting.subtitle')}
        backTo={`/projects/${projectId}?tab=preConstruction`}
      />

      {/* Meeting Info */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          {t('projects.meeting.info')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Calendar size={15} />
            <Input
              type="date"
              value={meeting.date}
              onChange={e => updateMutation.mutate({ date: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <MapPin size={15} />
            <Input
              value={meeting.location ?? ''}
              onChange={e => updateMutation.mutate({ location: e.target.value })}
              placeholder={t('projects.meeting.noLocation')}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Users size={15} /> {meeting.attendees.length} {t('projects.meeting.attendeesCount')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendees */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
            {t('projects.meeting.attendees')}
          </h3>
          <div className="space-y-1.5 mb-3">
            {meeting.attendees.map((name, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{name}</span>
                <button onClick={() => removeAttendee(idx)} className="text-neutral-400 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder={t('projects.meeting.addAttendee')} value={newAttendee} onChange={e => setNewAttendee(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAttendee()} />
            <Button size="sm" onClick={addAttendee}><Plus size={14} /></Button>
          </div>
        </div>

        {/* Agenda */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
            {t('projects.meeting.agenda')}
          </h3>
          <ol className="space-y-1.5 mb-3 list-decimal list-inside">
            {meeting.agenda.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <span className="text-sm text-neutral-700 dark:text-neutral-300">{item}</span>
                <button onClick={() => removeAgenda(idx)} className="text-neutral-400 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <Input placeholder={t('projects.meeting.addAgendaItem')} value={newAgenda} onChange={e => setNewAgenda(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAgenda()} />
            <Button size="sm" onClick={addAgenda}><Plus size={14} /></Button>
          </div>
        </div>

        {/* Decisions */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {t('projects.meeting.decisions')}
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {decisionsCompleted}/{meeting.decisions.length}
            </span>
          </div>
          <div className="space-y-1.5 mb-3">
            {meeting.decisions.map(d => (
              <button
                key={d.id}
                onClick={() => toggleDecision.mutate(d.id)}
                className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                {d.completed ? <CheckSquare size={15} className="text-green-500 shrink-0" /> : <Square size={15} className="text-neutral-400 shrink-0" />}
                <span className={`text-sm ${d.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-300'}`}>{d.text}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder={t('projects.meeting.addDecision')} value={newDecision} onChange={e => setNewDecision(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDecision()} />
            <Button size="sm" onClick={addDecision}><Plus size={14} /></Button>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              {t('projects.meeting.actionItems')}
            </h3>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {actionsCompleted}/{meeting.actionItems.length}
            </span>
          </div>
          <div className="space-y-1.5 mb-3">
            {meeting.actionItems.map(a => (
              <button
                key={a.id}
                onClick={() => toggleAction.mutate(a.id)}
                className="flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                {a.completed ? <CheckSquare size={15} className="text-green-500 shrink-0" /> : <Square size={15} className="text-neutral-400 shrink-0" />}
                <div className="flex-1">
                  <span className={`text-sm ${a.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-700 dark:text-neutral-300'}`}>{a.description}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {a.owner && <span className="text-[11px] text-blue-600 dark:text-blue-400">{a.owner}</span>}
                    {a.dueDate && <span className="text-[11px] text-neutral-400">{a.dueDate}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Input placeholder={t('projects.meeting.actionDescription')} value={newAction.description} onChange={e => setNewAction(a => ({ ...a, description: e.target.value }))} />
            <div className="flex gap-2">
              <Input placeholder={t('projects.meeting.actionOwner')} value={newAction.owner} onChange={e => setNewAction(a => ({ ...a, owner: e.target.value }))} />
              <Input type="date" value={newAction.dueDate} onChange={e => setNewAction(a => ({ ...a, dueDate: e.target.value }))} />
              <Button size="sm" onClick={addActionItem}><Plus size={14} /></Button>
            </div>
          </div>
        </div>
      </div>

      {/* Minutes */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
          {t('projects.meeting.minutes')}
        </h3>
        <textarea
          className="w-full min-h-[120px] p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-800 dark:text-neutral-200 resize-y"
          value={meeting.minutes ?? ''}
          onChange={e => updateMutation.mutate({ minutes: e.target.value })}
          placeholder={t('projects.meeting.minutesPlaceholder')}
        />
      </div>
    </div>
  );
};

export default PreConstructionMeetingPage;
