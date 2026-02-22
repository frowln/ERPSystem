import React from 'react';
import { KanbanSquare } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';
import { t } from '@/i18n';

const TaskBoardPage: React.FC = () => (
  <PlaceholderPage title={t('placeholder.taskBoardTitle')} icon={KanbanSquare} parentLabel={t('placeholder.parentProjects')} parentHref="/projects" />
);

export default TaskBoardPage;
