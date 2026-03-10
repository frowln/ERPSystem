import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { t } from '@/i18n';
import { tasksApi } from '@/api/tasks';
import { useUserOptions } from '@/hooks/useSelectOptions';
import { Select, Textarea } from '@/design-system/components/FormField';
import toast from 'react-hot-toast';

interface Props {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDelegateModal: React.FC<Props> = ({ taskId, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { options: userOptions } = useUserOptions();
  const [delegateId, setDelegateId] = useState('');
  const [comment, setComment] = useState('');

  const delegateName = userOptions.find((o) => o.value === delegateId)?.label ?? '';

  const mutation = useMutation({
    mutationFn: () => tasksApi.delegateTask(taskId, delegateId, delegateName, comment.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['TASK', taskId] });
      toast.success(t('taskDelegate.success'));
      setDelegateId('');
      setComment('');
      onClose();
    },
    onError: () => toast.error(t('taskDelegate.error')),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('taskDelegate.title')}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('taskDelegate.labelName')}
            </label>
            <Select
              options={[
                { value: '', label: t('taskDelegate.selectUser') },
                ...userOptions,
              ]}
              value={delegateId}
              onChange={(e) => setDelegateId(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              {t('taskDelegate.commentLabel')}
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('taskDelegate.commentPlaceholder')}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
            {t('common.cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!delegateId || mutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {t('taskDelegate.submit')}
          </button>
        </div>
      </div>
    </div>
  );
};
