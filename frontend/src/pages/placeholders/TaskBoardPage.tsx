import React from 'react';
import { KanbanSquare } from 'lucide-react';
import PlaceholderPage from './PlaceholderPage';

const TaskBoardPage: React.FC = () => (
  <PlaceholderPage title="Задачи (доска)" icon={KanbanSquare} parentLabel="Проекты" parentHref="/projects" />
);

export default TaskBoardPage;
