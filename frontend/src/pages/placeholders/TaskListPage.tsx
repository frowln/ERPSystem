import React from 'react';
import { ListTodo } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const TaskListPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.taskListTitle')} icon={ListTodo} parentLabel={t('placeholder.parentProjects')} parentHref="/projects" />
);

export default TaskListPage;
